# SignBridge AI

İşitme engelliler için erişilebilirlik platformu (NOVA Takımı).

## Yapı

```
signbridgeai/
├── frontend/   # React + Vite + TypeScript
└── backend/    # FastAPI + MediaPipe Holistic + ONNX Runtime
```

## Çalıştırma

### Backend (TİD tanıma)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Swagger: http://127.0.0.1:8000/docs
- Fiziksel telefonda test: `--host 0.0.0.0` ve Mac LAN IP kullanın.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aç: http://127.0.0.1:5173/kopru — kamera alanına dokununca canlı tanıma → `/api/sign/predict`.

Backend farklı bir adresteyse:

```bash
# frontend/.env
VITE_API_BASE=http://127.0.0.1:8000
```

### Model testi

```bash
cd backend && source .venv/bin/activate
python scripts/test_sign_model.py
python scripts/test_sign_model.py --video ornek.mp4
python scripts/test_sign_model.py --batch test_videos
```

Kendi videolarınızı şu yapıya koyun (gitignore’da):

```
backend/test_videos/MERHABA/01.mp4
backend/test_videos/YARDIM/01.mp4
...
```

## Vercel (frontend)

1. Repo’yu Vercel’e bağlayın.
2. **Root Directory:** `frontend`
3. Framework: Vite (otomatik), Build: `npm run build`, Output: `dist`
4. Environment Variable: `VITE_API_BASE` = backend’in public URL’i
5. Deploy → `https://….vercel.app` (QR için bu link)

Backend’i Vercel’e koymayın; Railway / Render / Fly.io kullanın.

## Kullanılan açık kaynak bileşenler

### SignBridge TİD modeli

- **Kaynak:** [esmasila/SignBridge](https://github.com/esmasila/SignBridge)
- **Mobil ONNX:** [esmasila/SignBridge-Mobile](https://github.com/esmasila/SignBridge-Mobile)
- **Yazar / katkı:** SignBridge Contributors
- **Lisans:** MIT — metin: `backend/app/ml/model/LICENSE`
- **Not:** Ana model geliştiricinin kendi TİD kayıtlarıyla eğitilmiştir (122 sınıf). Repodaki AUTSL yardımcı scriptleri **kullanılmamıştır / kopyalanmamıştır**.

### Akustik Radar (YAMNet)

- **Model:** Google YAMNet (521 AudioSet sınıfı), TFLite
- **Dosyalar:** `frontend/public/models/yamnet/yamnet.tflite`, `frontend/public/models/yamnet/yamnet_class_map.csv`
- **Kaynak:** [tensorflow/models audioset/yamnet](https://github.com/tensorflow/models/tree/master/research/audioset/yamnet), MediaPipe paketi: `https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite`
- **Çalıştırma:** [@mediapipe/tasks-audio](https://www.npmjs.com/package/@mediapipe/tasks-audio) 1.0.1 — Apache-2.0
- **Sınıf haritası:** Apache-2.0, TensorFlow Authors
- **Gizlilik:** Mikrofon sesi tarayıcıda işlenir; dosyaya yazılmaz, sunucuya gönderilmez. Yalnızca sınıf skorları kullanılır. Oturum geçmişi bellek içinde tutulur.
- **Not:** MediaPipe Tasks, Google’a API kullanım metrikleri gönderebilir (ses içeriği değil). Uçak modunda bu istekler düşer; model ve WASM yerelde servis edilir.

## Akustik Radar

Güvenlik ekranındaki radar, cihaz üzerinde YAMNet ile kapı zili, yangın/siren, bebek ağlaması ve araba kornasını tanır.

```bash
cd frontend
npm install
npm run dev
```

Aç: http://127.0.0.1:5173/guvenlik
# SignBridgeAI
