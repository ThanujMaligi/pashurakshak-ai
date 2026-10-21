import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base, SessionLocal
from .utils.real_data_loader import seed_real_data
from .routers import (
    auth, 
    incidents, 
    dispatch, 
    facilities, 
    analytics, 
    websocket
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Relational Schema (PostgreSQL/PostGIS or SQLite spatial)
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed Genuine Goa Facilities, Rescue Units & Accounts
    db = SessionLocal()
    try:
        seed_real_data(db)
    finally:
        db.close()
        
    print(f"[{settings.PROJECT_NAME}] Emergency CAD Backend Initialized.")
    yield
    print(f"[{settings.PROJECT_NAME}] Backend Shutting Down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="911-grade Emergency CAD and Multimodal AI Triage Operations for Animal Welfare across Goa.",
    lifespan=lifespan
)

# Enable CORS for Frontend & Mobile PWAs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads for Media Inspection
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(dispatch.router, prefix=settings.API_V1_STR)
app.include_router(facilities.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "cad_engine": "ACTIVE",
        "yolo_inference": "AVAILABLE",
        "region": "Goa, India"
    }
