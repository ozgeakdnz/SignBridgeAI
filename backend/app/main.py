from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.sign import router as sign_router
from app.services.sign_service import sign_service


@asynccontextmanager
async def lifespan(_app: FastAPI):
    sign_service.load_model()
    yield
    sign_service.close()


app = FastAPI(
    title="SignBridge AI API",
    description="TİD (Türk İşaret Dili) tanıma servisi",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sign_router)


@app.get("/health")
def health():
    return {"ok": True, "runtime": sign_service._runtime}
