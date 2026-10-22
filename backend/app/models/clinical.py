import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Enum, ForeignKey
from ..database import Base

class VitalStatus(str, enum.Enum):
    CRITICAL_ICU = "CRITICAL_ICU"
    POST_SURGERY = "POST_SURGERY"
    STABLE_TREATMENT = "STABLE_TREATMENT"
    RECOVERED_SHELTER = "RECOVERED_SHELTER"
    RELEASED_OR_ADOPTED = "RELEASED_OR_ADOPTED"
    DECEASED = "DECEASED"

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("emergency_incidents.id"), nullable=False, unique=True)
    facility_id = Column(Integer, ForeignKey("veterinary_facilities.id"), nullable=False)
    
    admitted_at = Column(DateTime, default=datetime.utcnow)
    vital_status = Column(Enum(VitalStatus), default=VitalStatus.CRITICAL_ICU)
    
    # Medical Diagnosis & Interventions (Entered by certified vet)
    attending_veterinarian = Column(String(100), nullable=False)
    initial_diagnosis = Column(Text, nullable=False)
    treatment_administered = Column(Text, nullable=False)
    surgery_performed = Column(Boolean, default=False)
    surgery_details = Column(Text, nullable=True)
    
    # Bed & Shelter Tracking
    assigned_icu_bed = Column(String(20), nullable=True) # e.g. "ICU-BAY-03"
    assigned_shelter_pen = Column(String(20), nullable=True) # e.g. "CANINE-RECOVERY-07"
    
    # Resolution & Proof
    discharge_date = Column(DateTime, nullable=True)
    recovery_photo_path = Column(String(255), nullable=True)
    closure_summary = Column(Text, nullable=True)
