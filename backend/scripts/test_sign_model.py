#!/usr/bin/env python3
"""
TİD model doğrulama scripti.

Kullanım:
  cd backend
  source .venv/bin/activate
  python scripts/test_sign_model.py
  python scripts/test_sign_model.py --video ornek.mp4
  python scripts/test_sign_model.py --batch test_videos
  python scripts/test_sign_model.py --npy-batch test_landmarks
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np

from app.ml.preprocess import INPUT_SIZE, SEQ_LEN, add_velocity
from app.services.sign_service import CONFIDENCE_THRESHOLD, sign_service


def test_random_input() -> None:
    print("=== Sentetik girdi testi (30×1755) ===")
    sign_service.load_model()
    rng = np.random.default_rng(42)
    seq_1629 = rng.normal(0, 0.1, size=(SEQ_LEN, 1629)).astype(np.float32)
    seq = add_velocity(seq_1629)
    assert seq.shape == (SEQ_LEN, INPUT_SIZE), seq.shape
    t0 = time.perf_counter()
    probs = sign_service._infer(seq)
    ms = (time.perf_counter() - t0) * 1000
    top3 = sorted(enumerate(probs), key=lambda x: -x[1])[:3]
    print(f"Runtime: {sign_service._runtime} | Inference: {ms:.1f} ms")
    print("Top-3 (tüm 122 sınıf):")
    for i, p in top3:
        print(f"  {sign_service.idx_to_label[i]:20s}  {p:.4f}")
    label, conf = sign_service._pick_demo(probs)
    print(f"Demo seçimi: {label} ({conf:.4f}) | eşik={CONFIDENCE_THRESHOLD}")
    sign_service.close()


def test_video(path: Path) -> dict:
    if sign_service._runtime is None:
        sign_service.load_model()
    t0 = time.perf_counter()
    result = sign_service.predict_sign(str(path))
    ms = (time.perf_counter() - t0) * 1000
    print(f"\n=== Video: {path.name} ({ms:.0f} ms) ===")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def _print_summary(rows: list[dict], *, pred_key: str = "pred") -> None:
    print("\n=== Özet ===")
    print(f"{'Dosya':42s} {'Beklenen':10s} {'Tahmin':12s} {'Conf':6s} {'OK'}")
    for row in rows:
        print(
            f"{row['file']:42s} {row['expected']:10s} {row[pred_key]:12s} "
            f"{row['conf']:6.3f} {'✓' if row['ok'] else '✗'}"
        )
    if not rows:
        return
    acc = sum(1 for r in rows if r["ok"]) / len(rows)
    avg_c = sum(r["conf"] for r in rows) / len(rows)
    print(f"\nDoğruluk: {acc*100:.1f}% ({sum(1 for r in rows if r['ok'])}/{len(rows)})")
    print(f"Ort. confidence: {avg_c:.3f}")
    by_word: dict[str, list] = {}
    for r in rows:
        by_word.setdefault(r["expected"], []).append(r)
    print("\nKelime bazında:")
    for w, items in sorted(by_word.items()):
        w_acc = sum(1 for i in items if i["ok"]) / len(items)
        w_c = sum(i["conf"] for i in items) / len(items)
        print(f"  {w:15s}  acc={w_acc*100:5.1f}%  avg_conf={w_c:.3f}  n={len(items)}")


def test_batch(folder: Path) -> None:
    """test_videos/<KELIME>/*.mp4 yapısını tarar."""
    sign_service.load_model()
    rows = []
    for label_dir in sorted(p for p in folder.iterdir() if p.is_dir()):
        expected = label_dir.name.upper().replace("_", " ")
        videos = list(label_dir.glob("*.mp4")) + list(label_dir.glob("*.mov"))
        for vid in videos:
            r = test_video(vid)
            pred = (r.get("label") or "").upper()
            ok = pred == expected or pred.replace(" ", "") == expected.replace(" ", "")
            rows.append(
                {
                    "file": str(vid.relative_to(folder)),
                    "expected": expected,
                    "pred": pred or "-",
                    "conf": r.get("confidence", 0),
                    "ok": ok,
                    "success": r.get("success"),
                }
            )
    _print_summary(rows)
    sign_service.close()


def test_npy_batch(folder: Path, *, full_vocab: bool = True) -> None:
    """
    test_landmarks/<KELIME>/*.npy — SignBridge tid_sequence formatı (T, 1629).
    Varsayılan: tam 122 sınıflı top-1 (daha adil).
    """
    sign_service.load_model()
    rows = []
    t0_all = time.perf_counter()

    for label_dir in sorted(p for p in folder.iterdir() if p.is_dir()):
        expected = label_dir.name.upper().replace("_", " ")
        files = sorted(label_dir.glob("*.npy"))
        print(f"\n--- {expected}: {len(files)} örnek ---")
        for npy_path in files:
            seq = np.load(npy_path)
            r = sign_service.predict_from_landmarks(seq, use_demo_filter=not full_vocab)
            if full_vocab:
                pred = (r.get("full_label") or "").upper()
                conf = r.get("full_confidence", 0)
            else:
                pred = (r.get("label") or "").upper()
                conf = r.get("confidence", 0)
            ok = pred == expected or pred.replace(" ", "") == expected.replace(" ", "")
            rows.append(
                {
                    "file": str(npy_path.relative_to(folder)),
                    "expected": expected,
                    "pred": pred or "-",
                    "conf": conf,
                    "ok": ok,
                    "top3": r.get("top3"),
                }
            )
            mark = "✓" if ok else "✗"
            print(f"  {mark} {npy_path.name:28s} → {pred:12s} ({conf:.3f})")

    elapsed = time.perf_counter() - t0_all
    mode = "122 sınıf (full)" if full_vocab else "demo filtresi"
    print(f"\nMod: {mode} | süre: {elapsed:.1f}s")
    _print_summary(rows)
    sign_service.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="SignBridge TİD model testi")
    parser.add_argument("--video", type=Path, help="Tek video dosyası")
    parser.add_argument("--batch", type=Path, help="test_videos klasörü")
    parser.add_argument(
        "--npy-batch",
        type=Path,
        nargs="?",
        const=ROOT / "test_landmarks",
        help="Landmark .npy klasörü (varsayılan: test_landmarks)",
    )
    parser.add_argument(
        "--demo-filter",
        action="store_true",
        help="npy testinde sadece demo_labels içinden seç",
    )
    args = parser.parse_args()

    if args.npy_batch is not None:
        test_npy_batch(args.npy_batch, full_vocab=not args.demo_filter)
    elif args.batch:
        test_batch(args.batch)
    elif args.video:
        sign_service.load_model()
        test_video(args.video)
        sign_service.close()
    else:
        # Varsayılan: sentetik + varsa npy landmark seti
        test_random_input()
        npy_dir = ROOT / "test_landmarks"
        if npy_dir.is_dir() and any(npy_dir.iterdir()):
            print("\n" + "=" * 60)
            test_npy_batch(npy_dir, full_vocab=True)


if __name__ == "__main__":
    main()
