import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class TriagePriority(str, enum.Enum):
    CRITICAL_P1 = "P1_CRITICAL"  # Life threatening (severe hemorrhage, severe trauma, respiratory distress)
    HIGH_P2 = "P2_HIGH"          # Urgent (fractures, immobility, deep lacerations, down cow)
    MODERATE_P3 = "P3_MODERATE"  # Stable but injured (mange, non-weight-bearing limp, mild cuts)
    ROUTINE_P4 = "P4_ROUTINE"    # Non-urgent (strays, abandoned pups, minor skin lesion)

class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    AI_TRIAGED = "AI_TRIAGED"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    ANIMAL_SECURED = "ANIMAL_SECURED"
    IN_TRANSIT = "IN_TRANSIT"
    ADMITTED = "ADMITTED"
    RESOLVED = "RESOLVED"
    MERGED_DUPLICATE = "MERGED_DUPLICATE"

class AnimalSpecies(str, enum.Enum):
    CANINE = "CANINE"
    BOVINE = "BOVINE"
    FELINE = "FELINE"
    EQUINE = "EQUINE"
    AVIAN = "AVIAN"
    WILDLIFE = "WILDLIFE"
    UNKNOWN = "UNKNOWN"

class EmergencyIncident(Base):
    __tablename__ = "emergency_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(32), unique=True, index=True, nullable=False)
    
    # Citizen Contact & Anonymization
    citizen_phone = Column(String(30), nullable=False)
    citizen_name = Column(String(100), default="Anonymous Citizen")
    
    # Geographic Telemetry (Goa Coordinates)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address_text = Column(Text, nullable=True)
    landmark = Column(String(150), nullable=True)
    taluka = Column(String(50), nullable=False, default="Tiswadi") # e.g. Bardez, Tiswadi, Salcete, Mormugao
    
    # Reported vs AI Assessed Species
    reported_species = Column(Enum(AnimalSpecies), default=AnimalSpecies.UNKNOWN)
    ai_detected_species = Column(Enum(AnimalSpecies), nullable=True)
    ai_species_confidence = Column(Float, nullable=True)
    
    # Advisory Triage Assessment
    ai_triage_priority = Column(Enum(TriagePriority), default=TriagePriority.HIGH_P2)
    ai_triage_reason = Column(Text, nullable=True)
    human_approved_priority = Column(Enum(TriagePriority), nullable=True)
    human_override_notes = Column(Text, nullable=True)
    
    # Case State Machine
    status = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED, index=True)
    
    # Deduplication Relationships
    is_duplicate = Column(Boolean, default=False)
    parent_incident_id = Column(Integer, ForeignKey("emergency_incidents.id"), nullable=True)
    duplicate_cluster_id = Column(String(64), nullable=True)
    distance_to_parent_meters = Column(Float, nullable=True)
    time_diff_parent_minutes = Column(Float, nullable=True)
    
    # Assigned Resources
    assigned_unit_id = Column(Integer, nullable=True)
    assigned_facility_id = Column(Integer, nullable=True)
    
    # Media Hash for Perceptual Deduplication
    primary_media_phash = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    media = relationship("IncidentMedia", back_populates="incident", cascade="all, delete-orphan")
    duplicates = relationship("EmergencyIncident", backref="parent_incident", remote_side=[id])

class IncidentMedia(Base):
    __tablename__ = "incident_media"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("emergency_incidents.id"), nullable=False)
    media_type = Column(String(20), nullable=False) # 'IMAGE', 'AUDIO', 'VIDEO'
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(100), nullable=False)
    
    # Perceptual Image Hash (pHash)
    phash = Column(String(64), nullable=True)
    
    # Audio Speech-to-Text Telemetry
    transcription = Column(Text, nullable=True)
    transcription_language = Column(String(20), nullable=True)
    transcription_confidence = Column(Float, nullable=True)
    
    # Raw AI Inference Telemetry
    yolo_boxes_json = Column(Text, nullable=True) # JSON dump of detected bounding boxes and class IDs
    ai_inference_time_ms = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    incident = relationship("EmergencyIncident", back_populates="media")
