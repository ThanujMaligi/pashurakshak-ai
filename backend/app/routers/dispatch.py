from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    EmergencyIncident, 
    RescueUnit, 
    DispatchAssignment, 
    AssignmentStatus, 
    IncidentStatus,
    AuditLog
)
from ..schemas.dispatch import DispatchCreateRequest, StatusUpdateRequest
from ..schemas.responder import TelemetryUpdateRequest
from ..engines import CapabilityDispatchEngine
from .websocket import manager

router = APIRouter(prefix="/dispatch", tags=["CAD Dispatch"])

@router.get("/recommendations/{incident_id}")
def get_recommendations(incident_id: int, db: Session = Depends(get_db)):
    """Computes constraint-checked and ranked responder units for an incident."""
    inc = db.query(EmergencyIncident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    recommendations = CapabilityDispatchEngine.get_ranked_dispatch_recommendations(db, inc)
    return {
        "incident_id": incident_id,
        "incident_tracking": inc.tracking_number,
        "species": inc.ai_detected_species.value if inc.ai_detected_species else inc.reported_species.value,
        "priority": inc.human_approved_priority.value if inc.human_approved_priority else inc.ai_triage_priority.value,
        "recommendations": recommendations
    }

@router.post("/assign")
async def assign_unit(request: DispatchCreateRequest, db: Session = Depends(get_db)):
    """Human dispatcher approves and assigns unit to emergency."""
    inc = db.query(EmergencyIncident).filter_by(id=request.incident_id).first()
    unit = db.query(RescueUnit).filter_by(id=request.rescue_unit_id).first()
    if not inc or not unit:
        raise HTTPException(status_code=404, detail="Incident or Rescue Unit not found.")

    # Re-evaluate constraints for safety
    recs = CapabilityDispatchEngine.get_ranked_dispatch_recommendations(db, inc)
    target_rec = next((r for r in recs if r["unit_id"] == unit.id), None)
    if target_rec and not target_rec["is_eligible"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot dispatch unit: {target_rec['recommendation_reason']}"
        )

    # Create assignment record
    assignment = DispatchAssignment(
        incident_id=inc.id,
        rescue_unit_id=unit.id,
        status=AssignmentStatus.ASSIGNED,
        calculated_distance_km=target_rec["distance_km"] if target_rec else 5.0,
        calculated_eta_minutes=target_rec["eta_minutes"] if target_rec else 12.0,
        recommendation_reason=target_rec["recommendation_reason"] if target_rec else "Manual dispatcher override",
        dispatched_at=datetime.utcnow(),
        field_notes=request.notes
    )
    db.add(assignment)

    # Update states
    inc.status = IncidentStatus.DISPATCHED
    inc.assigned_unit_id = unit.id
    unit.is_available = False
    unit.status_text = "DISPATCHED_TO_INCIDENT"

    audit = AuditLog(
        action="UNIT_DISPATCHED",
        entity_type="DISPATCH",
        entity_id=inc.id,
        user_identifier="GOA_CAD_DISPATCHER",
        details_json=f"Unit: {unit.unit_callsign}, ETA: {assignment.calculated_eta_minutes}m"
    )
    db.add(audit)
    db.commit()
    db.refresh(assignment)

    # Real-Time Broadcast
    await manager.broadcast("DISPATCH_ASSIGNED", {
        "assignment_id": assignment.id,
        "incident_id": inc.id,
        "tracking_number": inc.tracking_number,
        "unit_callsign": unit.unit_callsign,
        "eta_minutes": assignment.calculated_eta_minutes,
        "status": assignment.status.value
    })

    return {
        "success": True,
        "assignment_id": assignment.id,
        "unit_callsign": unit.unit_callsign,
        "eta_minutes": assignment.calculated_eta_minutes
    }

@router.post("/assignments/{assignment_id}/status")
async def update_assignment_status(
    assignment_id: int, 
    request: StatusUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Field responder updates on-scene milestones."""
    assignment = db.query(DispatchAssignment).filter_by(id=assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    assignment.status = request.status
    inc = db.query(EmergencyIncident).filter_by(id=assignment.incident_id).first()
    unit = db.query(RescueUnit).filter_by(id=assignment.rescue_unit_id).first()

    now = datetime.utcnow()
    if request.status == AssignmentStatus.EN_ROUTE:
        assignment.en_route_at = now
        if inc: inc.status = IncidentStatus.EN_ROUTE
    elif request.status == AssignmentStatus.ON_SCENE:
        assignment.on_scene_at = now
        if inc: inc.status = IncidentStatus.ON_SCENE
    elif request.status == AssignmentStatus.ANIMAL_SECURED:
        assignment.secured_at = now
        if inc: inc.status = IncidentStatus.ANIMAL_SECURED
    elif request.status == AssignmentStatus.IN_TRANSIT:
        if inc: inc.status = IncidentStatus.IN_TRANSIT
    elif request.status == AssignmentStatus.COMPLETED:
        assignment.completed_at = now
        if unit:
            unit.is_available = True
            unit.status_text = "STANDBY_BASE"

    if request.field_notes:
        assignment.field_notes = (assignment.field_notes or "") + f"\n[{now.strftime('%H:%M')}] {request.field_notes}"

    if request.latitude and request.longitude and unit:
        unit.current_latitude = request.latitude
        unit.current_longitude = request.longitude
        unit.last_ping = now

    db.commit()

    await manager.broadcast("STATUS_UPDATED", {
        "assignment_id": assignment.id,
        "incident_id": assignment.incident_id,
        "new_status": request.status.value
    })

    return {"success": True, "status": request.status.value}

@router.get("/units")
def get_all_units(db: Session = Depends(get_db)):
    units = db.query(RescueUnit).all()
    return [{
        "id": u.id,
        "unit_callsign": u.unit_callsign,
        "ngo_affiliation": u.ngo_affiliation,
        "contact_phone": u.contact_phone,
        "vehicle_type": u.vehicle_type.value,
        "max_weight_capacity_kg": u.max_weight_capacity_kg,
        "has_catchpole": u.has_catchpole,
        "has_cattle_lift": u.has_cattle_lift,
        "has_oxygen": u.has_oxygen,
        "has_tranquilizer_kit": u.has_tranquilizer_kit,
        "current_latitude": u.current_latitude,
        "current_longitude": u.current_longitude,
        "operating_taluka": u.operating_taluka,
        "is_available": u.is_available,
        "status_text": u.status_text,
        "last_ping": u.last_ping.isoformat() if u.last_ping else None
    } for u in units]

@router.post("/units/{unit_id}/telemetry")
async def update_unit_telemetry(
    unit_id: int, 
    request: TelemetryUpdateRequest, 
    db: Session = Depends(get_db)
):
    unit = db.query(RescueUnit).filter_by(id=unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")
    unit.current_latitude = request.latitude
    unit.current_longitude = request.longitude
    unit.last_ping = datetime.utcnow()
    if request.status_text:
        unit.status_text = request.status_text
    if request.is_available is not None:
        unit.is_available = request.is_available
    db.commit()

    await manager.broadcast("UNIT_TELEMETRY", {
        "unit_id": unit.id,
        "unit_callsign": unit.unit_callsign,
        "latitude": unit.current_latitude,
        "longitude": unit.current_longitude,
        "is_available": unit.is_available,
        "status_text": unit.status_text
    })
    return {"success": True}
