import math
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

# Create engine with appropriate thread-safety settings
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# If SQLite, register native geospatial math functions (haversine_distance, within_distance_meters)
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        # Register haversine distance in meters: haversine(lat1, lon1, lat2, lon2)
        def haversine(lat1, lon1, lat2, lon2):
            if any(v is None for v in (lat1, lon1, lat2, lon2)):
                return None
            R = 6371000.0 # Earth radius in meters
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            delta_phi = math.radians(lat2 - lat1)
            delta_lambda = math.radians(lon2 - lon1)
            
            a = math.sin(delta_phi / 2.0)**2 + \
                math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
            c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
            return R * c

        dbapi_connection.create_function("haversine_meters", 4, haversine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
