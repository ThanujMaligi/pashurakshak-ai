from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from ..models.dispatch import AssignmentStatus
from ..models.clinical import VitalStatus

class DispatchCreateRequest(BaseModel):
    incident_id: int
    rescue_unit_id: int
    notes: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: AssignmentStatus
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    field_notes: Optional[str] = None

class ClinicalAdmissionRequest(BaseModel):
    facility_id: int
    attending_vet: str
    initial_diagnosis: str
    treatment_plan: str
    vital_status: VitalStatus = VitalStatus.CRITICAL_ICU

class CaseClosureRequest(BaseModel):
    closure_summary: str
    vital_status: VitalStatus = VitalStatus.RELEASED_OR_ADOPTED

class DispatchResponse(BaseModel):
    id: int
    incident_id: int
    rescue_unit_id: int
    unit_callsign: str
    status: str
    calculated_distance_km: float
    calculated_eta_minutes: float
    recommendation_reason: str
    dispatched_at: datetime
    on_scene_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    field_notes: Optional[str] = None
