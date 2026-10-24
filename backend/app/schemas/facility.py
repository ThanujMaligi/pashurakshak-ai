from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class FacilityResponse(BaseModel):
    id: int
    name: str
    facility_type: str
    address: str
    taluka: str
    latitude: float
    longitude: float
    contact_phone: str
    emergency_direct_line: Optional[str]
    has_surgery_unit: bool
    large_animal_capable: bool
    has_xray_diagnostics: bool
    has_isolation_ward: bool
    total_icu_beds: int
    occupied_icu_beds: int
    available_icu_beds: int
    total_shelter_capacity: int
    current_shelter_occupancy: int
    available_shelter_beds: int
    is_open_24x7: bool
    is_verified_partner: bool
    last_capacity_update: datetime

class CapacityUpdateRequest(BaseModel):
    occupied_icu_beds: int
    current_shelter_occupancy: int
