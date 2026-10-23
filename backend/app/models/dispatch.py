import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey
from ..database import Base

class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    ANIMAL_SECURED = "ANIMAL_SECURED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class DispatchAssignment(Base):
    __tablename__ = "dispatch_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("emergency_incidents.id"), nullable=False)
    rescue_unit_id = Column(Integer, ForeignKey("rescue_units.id"), nullable=False)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, index=True)
    
    # Measured Telemetry
    calculated_distance_km = Column(Float, nullable=False)
    calculated_eta_minutes = Column(Float, nullable=False)
    recommendation_reason = Column(Text, nullable=False)
    
    # Milestone Audit Timestamps
    dispatched_at = Column(DateTime, default=datetime.utcnow)
    en_route_at = Column(DateTime, nullable=True)
    on_scene_at = Column(DateTime, nullable=True)
    secured_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Field notes and verification
    field_notes = Column(Text, nullable=True)
    rescue_proof_image_path = Column(String(255), nullable=True)
