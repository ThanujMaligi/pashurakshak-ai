from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from ..models.responder import VehicleType

class RescueUnitResponse(BaseModel):
    id: int
    unit_callsign: str
    ngo_affiliation: str
    contact_phone: str
    vehicle_type: VehicleType
    max_weight_capacity_kg: float
    has_catchpole: bool
    has_cattle_lift: bool
    has_oxygen: bool
    has_tranquilizer_kit: bool
    current_latitude: float
    current_longitude: float
    operating_taluka: str
    is_available: bool
    status_text: str
    last_ping: datetime

class TelemetryUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    status_text: Optional[str] = None
    is_available: Optional[bool] = None
