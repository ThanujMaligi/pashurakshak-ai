from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from ..database import Base

class VeterinaryFacility(Base):
    __tablename__ = "veterinary_facilities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    facility_type = Column(String(50), default="GOVT_HOSPITAL") # GOVT_HOSPITAL, NGO_SHELTER, PRIVATE_CLINIC
    address = Column(String(200), nullable=False)
    taluka = Column(String(50), nullable=False) # Tiswadi, Bardez, Salcete, etc.
    
    # Real Goa Hospital GPS Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_phone = Column(String(30), nullable=False)
    emergency_direct_line = Column(String(30), nullable=True)
    
    # Medical & Surgical Capabilities
    has_surgery_unit = Column(Boolean, default=True)
    large_animal_capable = Column(Boolean, default=False)
    has_xray_diagnostics = Column(Boolean, default=True)
    has_isolation_ward = Column(Boolean, default=False) # For rabies / distemper quarantine
    
    # Authenticated Capacity Counters (Strictly recorded with update timestamp)
    total_icu_beds = Column(Integer, default=6)
    occupied_icu_beds = Column(Integer, default=2)
    total_shelter_capacity = Column(Integer, default=40)
    current_shelter_occupancy = Column(Integer, default=28)
    
    is_open_24x7 = Column(Boolean, default=True)
    is_verified_partner = Column(Boolean, default=True)
    last_capacity_update = Column(DateTime, default=datetime.utcnow)
