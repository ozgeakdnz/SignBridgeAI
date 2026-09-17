from fastapi import APIRouter, File, Form, UploadFile

from app.services.sign_service import MAX_VIDEO_BYTES, sign_service

router = APIRouter(prefix="/api/sign", tags=["sign"])

ALLOWED_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
    "application/octet-stream",
}
ALLOWED_EXT = {".mp4", ".mov", ".webm", ".avi", ".mkv"}


@router.post("/predict")
async def predict_sign(video: UploadFile = File(...)):
    """
    Multipart video yükle → TİD tahmini.
    Alan adı: `video`
    """
    import os
    import tempfile
    from pathlib import Path

    filename = video.filename or "upload.mp4"
    ext = Path(filename).suffix.lower()
    content_type = (video.content_type or "").lower()

    if ext and ext not in ALLOWED_EXT and content_type not in ALLOWED_TYPES:
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "message": "Geçersiz dosya türü. Lütfen mp4, mov veya webm yükleyin.",
        }

    data = await video.read()
    if len(data) > MAX_VIDEO_BYTES:
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "message": "Video çok büyük (üst sınır 20 MB).",
        }
    if not data:
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "message": "Boş video dosyası.",
        }

    tmp_path = None
    try:
        suffix = ext if ext in ALLOWED_EXT else ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        result = sign_service.predict_sign(tmp_path)
        return {
            "success": result["success"],
            "label": result.get("label"),
            "confidence": result.get("confidence", 0.0),
            **(
                {"message": result["message"]}
                if not result["success"] and result.get("message")
                else {}
            ),
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "message": f"Model hatası: {exc}",
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


@router.post("/live-frame")
async def live_frame(
    frame: UploadFile = File(...),
    session_id: str = Form(...),
):
    """
    Canlı kamera: tek JPEG kare gönder.
    Sunucu MediaPipe landmark çıkarır, 30 karelik tampon doldukça tahmin döner.
    Video kaydı yok — veri setindeki kare/landmark akışına benzer.
    """
    sid = (session_id or "").strip()[:64]
    if not sid:
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "hands": False,
            "buffer": 0,
            "ready": False,
            "message": "session_id gerekli.",
        }

    data = await frame.read()
    try:
        result = sign_service.push_live_jpeg(sid, data)
        return result
    except Exception as exc:  # noqa: BLE001
        return {
            "success": False,
            "label": None,
            "confidence": 0.0,
            "hands": False,
            "buffer": 0,
            "ready": False,
            "message": f"Model hatası: {exc}",
        }


@router.post("/live-reset")
async def live_reset(session_id: str = Form(...)):
    sid = (session_id or "").strip()[:64]
    if sid:
        sign_service.reset_live_session(sid)
    return {"ok": True}
