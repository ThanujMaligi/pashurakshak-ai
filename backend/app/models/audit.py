from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from ..database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False) # INCIDENT, DISPATCH, CLINICAL, FACILITY
    entity_id = Column(Integer, nullable=False, index=True)
    user_identifier = Column(String(100), default="SYSTEM_AI")
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
