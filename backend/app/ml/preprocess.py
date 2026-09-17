"""
TİD öznitelik çıkarımı — SignBridge experiment_v2/web_app.py ile birebir uyumlu.
Kaynak: https://github.com/esmasila/SignBridge (MIT)
"""

from __future__ import annotations

import numpy as np

# ---- Boyutlar (V2 modeli) ----
FACE_END = 468 * 3  # 1404
POSE_END = FACE_END + 33 * 3  # 1503
LEFT_END = POSE_END + 21 * 3  # 1566
RIGHT_END = LEFT_END + 21 * 3  # 1629
HAND_VEL = 21 * 3 + 21 * 3  # 126
INPUT_SIZE = RIGHT_END + HAND_VEL  # 1755
SEQ_LEN = 30


def normalize_landmarks(lm: np.ndarray) -> np.ndarray:
    """İki aşamalı normalleştirme: omuz merkezli + bilek merkezli."""
    result = lm.copy()
    # KATMAN 1: Omuz-merkezli
    pose = result[FACE_END:POSE_END].reshape(33, 3)
    ls, rs = pose[11].copy(), pose[12].copy()
    if not (np.allclose(ls, 0) and np.allclose(rs, 0)):
        center = (
            rs.copy()
            if np.allclose(ls, 0)
            else (ls.copy() if np.allclose(rs, 0) else (ls + rs) / 2.0)
        )
        scale = float(np.linalg.norm(rs - ls))
        if scale >= 1e-4:
            all_lm = result.reshape(-1, 3)
            all_lm = (all_lm - center) / scale
            result = all_lm.flatten()
    # KATMAN 2: Sol el bilek-merkezli
    lh = result[POSE_END:LEFT_END].reshape(21, 3)
    if not np.allclose(lh[0], 0):
        wrist = lh[0].copy()
        palm_scale = np.linalg.norm(lh[9] - lh[0])
        if palm_scale > 1e-4:
            lh[1:] = (lh[1:] - wrist) / palm_scale
            result[POSE_END:LEFT_END] = lh.flatten()
    # KATMAN 2: Sağ el bilek-merkezli
    rh = result[LEFT_END:RIGHT_END].reshape(21, 3)
    if not np.allclose(rh[0], 0):
        wrist = rh[0].copy()
        palm_scale = np.linalg.norm(rh[9] - rh[0])
        if palm_scale > 1e-4:
            rh[1:] = (rh[1:] - wrist) / palm_scale
            result[LEFT_END:RIGHT_END] = rh.flatten()
    return result


def add_velocity(seq: np.ndarray) -> np.ndarray:
    """(T, 1629) -> (T, 1755)"""
    hands = seq[:, POSE_END:]
    vel = np.zeros_like(hands)
    vel[1:] = hands[1:] - hands[:-1]
    return np.concatenate([seq, vel], axis=1).astype(np.float32)


def extract_landmarks(results) -> np.ndarray:
    """MediaPipe Holistic sonuçlarından (1629,) vektör."""
    lm: list[float] = []
    if results.face_landmarks:
        for p in results.face_landmarks.landmark:
            lm.extend([p.x, p.y, p.z])
    else:
        lm.extend([0.0] * 468 * 3)
    if results.pose_landmarks:
        for p in results.pose_landmarks.landmark:
            lm.extend([p.x, p.y, p.z])
    else:
        lm.extend([0.0] * 33 * 3)
    if results.left_hand_landmarks:
        for p in results.left_hand_landmarks.landmark:
            lm.extend([p.x, p.y, p.z])
    else:
        lm.extend([0.0] * 21 * 3)
    if results.right_hand_landmarks:
        for p in results.right_hand_landmarks.landmark:
            lm.extend([p.x, p.y, p.z])
    else:
        lm.extend([0.0] * 21 * 3)
    return np.array(lm, dtype=np.float32)


def has_hand(lm: np.ndarray) -> bool:
    lh = lm[POSE_END:LEFT_END]
    rh = lm[LEFT_END:RIGHT_END]
    return not (np.allclose(lh, 0) and np.allclose(rh, 0))
