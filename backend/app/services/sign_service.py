"""
TİD tanıma servisi — ONNX Runtime (tercih) veya PyTorch CPU.
"""

from __future__ import annotations

import json
import logging
import threading
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np

from app.ml.preprocess import (
    INPUT_SIZE,
    POSE_END,
    RIGHT_END,
    SEQ_LEN,
    add_velocity,
    extract_landmarks,
    has_hand,
    normalize_landmarks,
)

logger = logging.getLogger(__name__)

ML_DIR = Path(__file__).resolve().parent.parent / "ml"
MODEL_DIR = ML_DIR / "model"
ONNX_PATH = MODEL_DIR / "model_v2.onnx"
PT_PATH = MODEL_DIR / "best_model.pt"
ORIGINAL_LABELS_PATH = ML_DIR / "original_labels.json"
DEMO_LABELS_PATH = ML_DIR / "demo_labels.json"

# Başlangıç eşiği (görev spesifikasyonu); video penceresi sonrası ayarlanabilir
CONFIDENCE_THRESHOLD = 0.60
# Canlı: demo-normalize skor + marj
LIVE_CONFIDENCE_THRESHOLD = 0.42
LIVE_MARGIN = 0.08
# Webcam dinlenme / yüz-göğüs jesti → sürekli yanlış ANNE/BABA/DİKKAT
# Canlı seçimde tamamen dışlanır (npy/video batch'te hâlâ var)
LIVE_BLOCKED_LABELS = {"ANNE", "BABA", "DIKKAT"}
# El hareketi yoksa (statik poz) tahmin yok — bias'ın ana kaynağı
LIVE_MIN_HAND_MOTION = 0.012
TARGET_FPS = 30
WINDOW_STEP = 5  # kayan pencere adımı
MAX_VIDEO_BYTES = 20 * 1024 * 1024
LIVE_SESSION_TTL_SEC = 120
LIVE_MAX_JPEG_BYTES = 1_500_000
# Tampon: kısa el kayıplarında sıfırlama (yüz yakınında MediaPipe eli kaçırır)
LIVE_MISS_CLEAR = 10
# En az bu kadar GERÇEK el karesi (tekrar pad sayılmaz)
LIVE_READY_FRAMES = 18


class SignService:
    def __init__(self) -> None:
        self._session: Any = None
        self._torch_model: Any = None
        self._runtime: str | None = None
        self._holistic: Any = None
        self._holistic_live: Any = None
        self.label_map: dict[str, int] = {}
        self.idx_to_label: dict[int, str] = {}
        self.demo_labels: set[str] = set()
        self.demo_indices: list[int] = []
        self._live_lock = threading.Lock()
        self._live_bufs: dict[str, deque[np.ndarray]] = defaultdict(
            lambda: deque(maxlen=SEQ_LEN)
        )
        self._live_touch: dict[str, float] = {}
        self._live_miss: dict[str, int] = defaultdict(int)

    def load_model(self) -> None:
        with open(ORIGINAL_LABELS_PATH, encoding="utf-8") as f:
            self.label_map = json.load(f)
        self.idx_to_label = {v: k for k, v in self.label_map.items()}

        with open(DEMO_LABELS_PATH, encoding="utf-8") as f:
            demo_list = json.load(f)
        self.demo_labels = set(demo_list)
        self.demo_indices = [self.label_map[w] for w in demo_list if w in self.label_map]

        # Holistic bir kez (video akışı)
        self._holistic = mp.solutions.holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            refine_face_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        # Canlı JPEG — complexity 1: el yüz yakınında daha az kaybolur
        self._holistic_live = mp.solutions.holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            refine_face_landmarks=False,
            min_detection_confidence=0.4,
            min_tracking_confidence=0.4,
        )

        if ONNX_PATH.exists():
            import onnxruntime as ort

            self._session = ort.InferenceSession(
                str(ONNX_PATH),
                providers=["CPUExecutionProvider"],
            )
            self._runtime = "onnx"
            logger.info("ONNX model yüklendi: %s", ONNX_PATH)
        elif PT_PATH.exists():
            import torch
            import torch.nn as nn

            class GRUModel(nn.Module):
                def __init__(
                    self,
                    input_size=INPUT_SIZE,
                    hidden=256,
                    layers=2,
                    classes=122,
                    dropout=0.3,
                ):
                    super().__init__()
                    self.gru = nn.GRU(
                        input_size,
                        hidden,
                        layers,
                        batch_first=True,
                        dropout=dropout if layers > 1 else 0.0,
                    )
                    self.classifier = nn.Sequential(
                        nn.Dropout(dropout),
                        nn.Linear(hidden, 128),
                        nn.ReLU(),
                        nn.Dropout(dropout * 0.5),
                        nn.Linear(128, classes),
                    )

                def forward(self, x):
                    _, h = self.gru(x)
                    return self.classifier(h[-1])

            ckpt = torch.load(PT_PATH, map_location="cpu", weights_only=False)
            num_classes = ckpt.get("num_classes", len(self.label_map))
            model = GRUModel(classes=num_classes)
            model.load_state_dict(ckpt["model_state_dict"])
            model.eval()
            self._torch_model = model
            if "label_map" in ckpt:
                self.label_map = ckpt["label_map"]
                self.idx_to_label = {v: k for k, v in self.label_map.items()}
                self.demo_indices = [
                    self.label_map[w] for w in demo_list if w in self.label_map
                ]
            self._runtime = "pytorch"
            logger.info("PyTorch model yüklendi: %s", PT_PATH)
        else:
            raise FileNotFoundError("Ne ONNX ne PyTorch model dosyası bulundu.")

    def close(self) -> None:
        if self._holistic is not None:
            self._holistic.close()
            self._holistic = None
        if self._holistic_live is not None:
            self._holistic_live.close()
            self._holistic_live = None

    def _softmax(self, logits: np.ndarray) -> np.ndarray:
        x = logits.astype(np.float64)
        x = x - np.max(x)
        e = np.exp(x)
        return (e / e.sum()).astype(np.float32)

    def _infer(self, seq_1755: np.ndarray) -> np.ndarray:
        """(30, 1755) -> softmax probs (122,)"""
        x = seq_1755.astype(np.float32)[np.newaxis, ...]  # (1, 30, 1755)
        if self._runtime == "onnx":
            inp_name = self._session.get_inputs()[0].name
            out = self._session.run(None, {inp_name: x})[0]
            logits = np.asarray(out).reshape(-1)
        else:
            import torch

            with torch.no_grad():
                t = torch.from_numpy(x)
                logits = self._torch_model(t).numpy().reshape(-1)
        return self._softmax(logits)

    def _pick_demo(self, probs: np.ndarray) -> tuple[str | None, float]:
        """Demo listesindeki en yüksek olasılıklı kelimeyi seç."""
        best_i = -1
        best_p = -1.0
        for i in self.demo_indices:
            if probs[i] > best_p:
                best_p = float(probs[i])
                best_i = i
        if best_i < 0:
            return None, 0.0
        return self.idx_to_label[best_i], best_p

    def _pick_demo_renorm(
        self,
        probs: np.ndarray,
        *,
        blocked: set[str] | None = None,
    ) -> tuple[str | None, float, float, list[tuple[float, str]]]:
        """Demo sınıfları üzerinde yeniden normalize et + 1.–2. marj."""
        if not self.demo_indices:
            return None, 0.0, 0.0, []
        blocked = blocked or set()
        raw = []
        labels = []
        for i in self.demo_indices:
            name = self.idx_to_label[i]
            if name.upper() in blocked:
                continue
            raw.append(float(probs[i]))
            labels.append(name)
        if not raw:
            return None, 0.0, 0.0, []
        raw_a = np.array(raw, dtype=np.float64)
        total = float(raw_a.sum())
        if total < 1e-12:
            return None, 0.0, 0.0, []
        renorm = raw_a / total
        order = np.argsort(-renorm)
        top_i = int(order[0])
        second = float(renorm[order[1]]) if len(order) > 1 else 0.0
        conf = float(renorm[top_i])
        margin = conf - second
        label = labels[top_i]
        pairs = [(float(renorm[int(i)]), labels[int(i)]) for i in order[:3]]
        return label, conf, margin, pairs

    @staticmethod
    def _hand_motion_energy(window_1629: np.ndarray) -> float:
        """Penceredeki ortalama el hareketi (statik ANNE/BABA pozunu elemek için)."""
        hands = window_1629[:, POSE_END:RIGHT_END]
        if hands.shape[0] < 2:
            return 0.0
        delta = hands[1:] - hands[:-1]
        return float(np.mean(np.linalg.norm(delta, axis=1)))

    def predict_from_landmarks(
        self,
        seq_1629: np.ndarray,
        *,
        use_demo_filter: bool = True,
    ) -> dict[str, Any]:
        """
        Ham landmark sekansı (T, 1629) → tahmin.
        SignBridge tid_sequence .npy formatı ile uyumlu.
        """
        if self._session is None and self._torch_model is None:
            raise RuntimeError("Model yüklenmedi.")

        seq = np.asarray(seq_1629, dtype=np.float32)
        if seq.ndim != 2 or seq.shape[1] != 1629:
            raise ValueError(f"Beklenen shape (T, 1629), gelen: {seq.shape}")

        # Kare bazında V2 normalizasyonu
        norms = [normalize_landmarks(seq[t]) for t in range(seq.shape[0])]
        norms_arr = np.stack(norms, axis=0)

        # 30 kareye indir (eşit aralıklı örnekleme veya pad)
        t = norms_arr.shape[0]
        if t >= SEQ_LEN:
            idx = np.linspace(0, t - 1, SEQ_LEN).astype(int)
            window = norms_arr[idx]
        else:
            pad = np.repeat(norms_arr[-1:], SEQ_LEN - t, axis=0)
            window = np.concatenate([norms_arr, pad], axis=0)

        feats = add_velocity(window)
        probs = self._infer(feats)

        # Tam sözlük top-1
        top_i = int(np.argmax(probs))
        full_label = self.idx_to_label[top_i]
        full_conf = float(probs[top_i])

        top3_full = sorted(
            ((float(probs[i]), self.idx_to_label[i]) for i in range(len(probs))),
            reverse=True,
        )[:3]

        demo_label, demo_conf = self._pick_demo(probs)

        if use_demo_filter:
            label, conf = demo_label, demo_conf
            success = bool(label) and conf >= CONFIDENCE_THRESHOLD
        else:
            label, conf = full_label, full_conf
            success = conf >= CONFIDENCE_THRESHOLD

        return {
            "success": success,
            "label": label.lower() if label else None,
            "confidence": round(float(conf), 4),
            "full_label": full_label,
            "full_confidence": round(full_conf, 4),
            "top3": [{"label": w, "confidence": round(p, 4)} for p, w in top3_full],
            "message": None
            if success
            else "İşaret yeterince net algılanamadı.",
        }

    def _read_frames(self, video_path: str) -> list[np.ndarray]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Video açılamadı.")

        # Rotation metadata (OpenCV 4.5+)
        rotate_code = None
        try:
            orientation = int(cap.get(cv2.CAP_PROP_ORIENTATION_META))
            if orientation == 90:
                rotate_code = cv2.ROTATE_90_CLOCKWISE
            elif orientation == 180:
                rotate_code = cv2.ROTATE_180
            elif orientation == 270:
                rotate_code = cv2.ROTATE_90_COUNTERCLOCKWISE
        except Exception:
            pass

        src_fps = cap.get(cv2.CAP_PROP_FPS) or TARGET_FPS
        if src_fps <= 1:
            src_fps = TARGET_FPS
        frame_interval = max(src_fps / TARGET_FPS, 1e-6)

        frames: list[np.ndarray] = []
        idx = 0
        next_take = 0.0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if idx >= next_take:
                if rotate_code is not None:
                    frame = cv2.rotate(frame, rotate_code)
                frames.append(frame)
                next_take += frame_interval
            idx += 1
        cap.release()
        return frames

    def _frames_to_features(self, frames: list[np.ndarray]) -> list[np.ndarray]:
        feats: list[np.ndarray] = []
        for frame in frames:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self._holistic.process(rgb)
            lm = extract_landmarks(results)
            if not has_hand(lm):
                # El yok: sıfır çerçeve (zaman hizasını koru)
                feats.append(np.zeros(RIGHT_END, dtype=np.float32))
                continue
            feats.append(normalize_landmarks(lm))
        return feats

    def predict_sign(self, video_path: str) -> dict[str, Any]:
        if self._session is None and self._torch_model is None:
            raise RuntimeError("Model yüklenmedi.")

        frames = self._read_frames(video_path)
        if len(frames) < 5:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "message": "Video çok kısa; en az ~1 saniyelik kayıt gerekli.",
            }

        feats = self._frames_to_features(frames)
        hand_frames = [f for f in feats if not np.allclose(f, 0)]
        if len(hand_frames) < SEQ_LEN // 2:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "message": "El algılanamadı. İşareti kameraya net gösterin.",
            }

        # Yeterli el karesi yoksa mevcutları tekrarla / pad
        seq_source = hand_frames if len(hand_frames) >= SEQ_LEN else feats
        if len(seq_source) < SEQ_LEN:
            pad = [seq_source[-1]] * (SEQ_LEN - len(seq_source)) if seq_source else [
                np.zeros(1629, dtype=np.float32)
            ] * SEQ_LEN
            seq_source = list(seq_source) + pad

        best_label: str | None = None
        best_conf = 0.0
        top3_global: list[dict[str, Any]] = []

        for start in range(0, len(seq_source) - SEQ_LEN + 1, WINDOW_STEP):
            window = np.stack(seq_source[start : start + SEQ_LEN], axis=0)
            seq = add_velocity(window)
            probs = self._infer(seq)
            label, conf = self._pick_demo(probs)

            # top-3 demo
            demo_pairs = sorted(
                ((float(probs[i]), self.idx_to_label[i]) for i in self.demo_indices),
                reverse=True,
            )[:3]
            if not top3_global or demo_pairs[0][0] > top3_global[0]["confidence"]:
                top3_global = [
                    {"label": w, "confidence": round(p, 4)} for p, w in demo_pairs
                ]

            if label and conf > best_conf:
                best_conf = conf
                best_label = label

        # Tek pencere (video tam SEQ_LEN civarı)
        if best_label is None and len(seq_source) >= SEQ_LEN:
            window = np.stack(seq_source[-SEQ_LEN:], axis=0)
            probs = self._infer(add_velocity(window))
            best_label, best_conf = self._pick_demo(probs)
            demo_pairs = sorted(
                ((float(probs[i]), self.idx_to_label[i]) for i in self.demo_indices),
                reverse=True,
            )[:3]
            top3_global = [
                {"label": w, "confidence": round(p, 4)} for p, w in demo_pairs
            ]

        if best_label is None or best_conf < CONFIDENCE_THRESHOLD:
            return {
                "success": False,
                "label": best_label,
                "confidence": round(float(best_conf), 4),
                "message": "İşaret yeterince net algılanamadı.",
                "top3": top3_global,
            }

        return {
            "success": True,
            "label": best_label.lower(),
            "confidence": round(float(best_conf), 4),
            "top3": top3_global,
        }

    def _purge_live_sessions(self) -> None:
        now = time.time()
        stale = [
            sid
            for sid, ts in self._live_touch.items()
            if now - ts > LIVE_SESSION_TTL_SEC
        ]
        for sid in stale:
            self._live_bufs.pop(sid, None)
            self._live_touch.pop(sid, None)
            self._live_miss.pop(sid, None)

    def reset_live_session(self, session_id: str) -> None:
        with self._live_lock:
            self._live_bufs.pop(session_id, None)
            self._live_touch.pop(session_id, None)
            self._live_miss.pop(session_id, None)

    def push_live_jpeg(self, session_id: str, jpeg_bytes: bytes) -> dict[str, Any]:
        """
        Tek JPEG → landmark → kayan tampon → demo tahmini.
        Kısa el kayıplarında tamponu SIFIRLAMAZ (6/30'da takılma fix).
        """
        if self._session is None and self._torch_model is None:
            raise RuntimeError("Model yüklenmedi.")
        if self._holistic_live is None:
            raise RuntimeError("MediaPipe yüklenmedi.")
        if not jpeg_bytes or len(jpeg_bytes) > LIVE_MAX_JPEG_BYTES:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "hands": False,
                "buffer": 0,
                "ready": False,
                "message": "Geçersiz kare.",
            }

        arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgr is None:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "hands": False,
                "buffer": 0,
                "ready": False,
                "message": "Kare çözülemedi.",
            }

        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        results = self._holistic_live.process(rgb)
        lm = extract_landmarks(results)
        hands = has_hand(lm)

        with self._live_lock:
            self._purge_live_sessions()
            buf = self._live_bufs[session_id]
            self._live_touch[session_id] = time.time()

            if not hands:
                miss = self._live_miss[session_id] + 1
                self._live_miss[session_id] = miss
                if miss >= LIVE_MISS_CLEAR:
                    buf.clear()
                    self._live_miss[session_id] = 0
                    return {
                        "success": False,
                        "label": None,
                        "confidence": 0.0,
                        "hands": False,
                        "buffer": 0,
                        "ready": False,
                        "message": None,
                    }
                # Tekrar kare EKLEME — statik pad ANNE/BABA üretiyordu
                return {
                    "success": False,
                    "label": None,
                    "confidence": 0.0,
                    "hands": False,
                    "buffer": len(buf),
                    "ready": False,
                    "message": None,
                }

            self._live_miss[session_id] = 0
            buf.append(normalize_landmarks(lm))
            buffer_len = len(buf)
            if buffer_len < LIVE_READY_FRAMES:
                return {
                    "success": False,
                    "label": None,
                    "confidence": 0.0,
                    "hands": True,
                    "buffer": buffer_len,
                    "ready": False,
                    "message": None,
                }
            window = np.stack(list(buf), axis=0)

        # 18–29 kareyi 30'a pad
        t = window.shape[0]
        if t < SEQ_LEN:
            pad = np.repeat(window[-1:], SEQ_LEN - t, axis=0)
            window = np.concatenate([window, pad], axis=0)
        elif t > SEQ_LEN:
            window = window[-SEQ_LEN:]

        motion = self._hand_motion_energy(window)
        if motion < LIVE_MIN_HAND_MOTION:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "hands": True,
                "buffer": buffer_len,
                "ready": True,
                "motion": round(motion, 5),
                "message": None,
                "candidate": None,
            }

        probs = self._infer(add_velocity(window.astype(np.float32)))
        label, conf, margin, pairs = self._pick_demo_renorm(
            probs, blocked=LIVE_BLOCKED_LABELS
        )
        top3 = [{"label": w.lower(), "confidence": round(p, 4)} for p, w in pairs]

        if not label:
            return {
                "success": False,
                "label": None,
                "confidence": 0.0,
                "hands": True,
                "buffer": buffer_len,
                "ready": True,
                "top3": top3,
                "margin": 0.0,
                "motion": round(motion, 5),
                "message": None,
            }

        success = conf >= LIVE_CONFIDENCE_THRESHOLD and margin >= LIVE_MARGIN

        return {
            "success": success,
            "label": label.lower() if success else None,
            "confidence": round(float(conf), 4),
            "hands": True,
            "buffer": buffer_len,
            "ready": True,
            "top3": top3,
            "margin": round(float(margin), 4),
            "motion": round(motion, 5),
            "candidate": label.lower(),
            "message": None,
        }


sign_service = SignService()
