import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from ..database import Base

class VehicleType(str, enum.Enum):
    TWO_WHEELER = "TWO_WHEELER"                   # Rapid scout, small cage only, max 15kg
    SMALL_ANIMAL_AMBULANCE = "SMALL_ANIMAL_AMBULANCE" # Dogs, cats, small calves up to 60kg
    CATTLE_HYDRAULIC_TRUCK = "CATTLE_HYDRAULIC_TRUCK" # Large cattle, adult bovine up to 500kg with lift
    WILDLIFE_RESCUE_VAN = "WILDLIFE_RESCUE_VAN"       # Heavy nets, snake tongs, tranquilizer box

class RescueUnit(Base):
    __tablename__ = "rescue_units"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_callsign = Column(String(60), unique=True, nullable=False)
    ngo_affiliation = Column(String(100), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    max_weight_capacity_kg = Column(Float, default=50.0)
    
    # Critical Equipment Flags for Constraint-Based Dispatch
    has_catchpole = Column(Boolean, default=True)
    has_cattle_lift = Column(Boolean, default=False)
    has_oxygen = Column(Boolean, default=False)
    has_tranquilizer_kit = Column(Boolean, default=False)
    
    # Real-Time Geospatial Coordinates in Goa
    current_latitude = Column(Float, nullable=False)
    current_longitude = Column(Float, nullable=False)
    operating_taluka = Column(String(50), default="Tiswadi") # Home base
    
    # Operational Status
    is_available = Column(Boolean, default=True, index=True)
    status_text = Column(String(50), default="STANDBY_BASE") # STANDBY_BASE, EN_ROUTE, ON_SCENE, RETURNING
    last_ping = Column(DateTime, default=datetime.utcnow)
