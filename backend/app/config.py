import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "PashuRakshak AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database (Defaults to local SQLite with GIS helper math, supports PostgreSQL/PostGIS)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'data' / 'pashurakshak.db'}"
    )
    
    # Storage
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    MODEL_DIR: Path = BASE_DIR / "data" / "models"
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pashurakshak-goa-ai-super-secret-key-2026-cad")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Deduplication Engine Defaults (Evaluated against Goa coastal and highway geography)
    DEDUP_SPATIAL_RADIUS_METERS: float = 250.0 # 250m buffer
    DEDUP_TIME_WINDOW_HOURS: float = 3.0       # 3 hours
    DEDUP_PHASH_THRESHOLD: int = 12            # Hamming distance threshold for image similarity
    
    # AI Engine Thresholds
    YOLO_CONFIDENCE_THRESHOLD: float = 0.35
    SPECIES_CLASSES: list[str] = ["canine", "bovine", "feline", "equine", "avian", "wildlife", "unknown"]
    
    # WhatsApp Cloud API (Real credentials or unverified test mode)
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "pashu_verify_token_2026")
    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    
    # Geographic Bounds: Goa State (Lat 14.89 to 15.80, Lon 73.68 to 74.35)
    GOA_BOUNDS: dict = {
        "min_lat": 14.89,
        "max_lat": 15.80,
        "min_lon": 73.68,
        "max_lon": 74.35
    }

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
