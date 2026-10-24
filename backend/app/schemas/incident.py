from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from ..models.incident import TriagePriority, IncidentStatus, AnimalSpecies

class IncidentCreate(BaseModel):
    citizen_phone: str
    citizen_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_text: Optional[str] = None
    landmark: Optional[str] = None
    reported_species: AnimalSpecies = AnimalSpecies.UNKNOWN

class IncidentOverrideRequest(BaseModel):
    approved_priority: TriagePriority
    override_notes: str

class DuplicateMergeRequest(BaseModel):
    master_incident_id: int
    dispatcher_notes: str

class MediaResponse(BaseModel):
    id: int
    media_type: str
    file_path: str
    phash: Optional[str] = None
    transcription: Optional[str] = None
    transcription_language: Optional[str] = None
    inference_time_ms: Optional[float] = None

class IncidentResponse(BaseModel):
    id: int
    tracking_number: str
    citizen_phone_masked: str
    citizen_name: str
    latitude: float
    longitude: float
    address_text: Optional[str]
    landmark: Optional[str]
    taluka: str
    reported_species: str
    ai_detected_species: Optional[str]
    ai_species_confidence: Optional[float]
    ai_triage_priority: str
    ai_triage_reason: Optional[str]
    human_approved_priority: Optional[str]
    status: str
    is_duplicate: bool
    parent_incident_id: Optional[int]
    assigned_unit_id: Optional[int]
    assigned_facility_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    media: List[MediaResponse] = []
