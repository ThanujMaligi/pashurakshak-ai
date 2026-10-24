from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    EmergencyIncident, 
    VeterinaryFacility, 
    ClinicalRecord, 
    VitalStatus,
    AuditLog
)
from ..schemas.dispatch import ClinicalAdmissionRequest, CaseClosureRequest
from ..schemas.facility import CapacityUpdateRequest
from ..engines import ClinicalCoordinationEngine
from .websocket import manager

router = APIRouter(prefix="/facilities", tags=["Veterinary & Shelter Facilities"])

@router.get("")
def list_facilities(db: Session = Depends(get_db)):
    """Lists all registered veterinary facilities with live bed availability."""
    facilities = db.query(VeterinaryFacility).all()
    return [{
        "id": f.id,
        "name": f.name,
        "facility_type": f.facility_type,
        "address": f.address,
        "taluka": f.taluka,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "contact_phone": f.contact_phone,
        "emergency_direct_line": f.emergency_direct_line,
        "has_surgery_unit": f.has_surgery_unit,
        "large_animal_capable": f.large_animal_capable,
        "has_xray_diagnostics": f.has_xray_diagnostics,
        "has_isolation_ward": f.has_isolation_ward,
        "total_icu_beds": f.total_icu_beds,
        "occupied_icu_beds": f.occupied_icu_beds,
        "available_icu_beds": max(0, f.total_icu_beds - f.occupied_icu_beds),
        "total_shelter_capacity": f.total_shelter_capacity,
        "current_shelter_occupancy": f.current_shelter_occupancy,
        "available_shelter_beds": max(0, f.total_shelter_capacity - f.current_shelter_occupancy),
        "is_open_24x7": f.is_open_24x7,
        "is_verified_partner": f.is_verified_partner,
        "last_capacity_update": f.last_capacity_update.isoformat() if f.last_capacity_update else None
    } for f in facilities]

@router.get("/match/{incident_id}")
def match_facility_for_incident(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(EmergencyIncident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    recommendations = ClinicalCoordinationEngine.find_best_facilities(db, inc)
    return {
        "incident_id": incident_id,
        "species": inc.ai_detected_species.value if inc.ai_detected_species else inc.reported_species.value,
        "facilities": recommendations
    }

@router.post("/admit/{incident_id}")
async def admit_animal(
    incident_id: int, 
    request: ClinicalAdmissionRequest, 
    db: Session = Depends(get_db)
):
    """Admits rescued animal to veterinary hospital ICU/ward."""
    record = ClinicalCoordinationEngine.admit_patient(
        db=db,
        incident_id=incident_id,
        facility_id=request.facility_id,
        attending_vet=request.attending_vet,
        initial_diagnosis=request.initial_diagnosis,
        treatment_plan=request.treatment_plan,
        vital_status=request.vital_status
    )

    audit = AuditLog(
        action="ANIMAL_ADMITTED_CLINIC",
        entity_type="CLINICAL",
        entity_id=incident_id,
        user_identifier=f"VET:{request.attending_vet}",
        details_json=f"Facility #{request.facility_id}, Bay: {record.assigned_icu_bed}"
    )
    db.add(audit)
    db.commit()

    await manager.broadcast("CLINICAL_ADMISSION", {
        "incident_id": incident_id,
        "facility_id": request.facility_id,
        "assigned_icu_bed": record.assigned_icu_bed,
        "vital_status": record.vital_status.value
    })

    return {"success": True, "record_id": record.id, "bay": record.assigned_icu_bed}

@router.post("/discharge/{incident_id}")
async def discharge_animal(
    incident_id: int, 
    request: CaseClosureRequest, 
    db: Session = Depends(get_db)
):
    """Discharges recovered animal and completes case closure."""
    success = ClinicalCoordinationEngine.discharge_and_close_case(
        db=db,
        incident_id=incident_id,
        closure_summary=request.closure_summary
    )
    if not success:
        raise HTTPException(status_code=404, detail="Clinical record or incident not found.")

    audit = AuditLog(
        action="CASE_RESOLVED_CLOSED",
        entity_type="INCIDENT",
        entity_id=incident_id,
        user_identifier="VET_SUPERVISOR",
        details_json=request.closure_summary
    )
    db.add(audit)
    db.commit()

    await manager.broadcast("CASE_RESOLVED", {"incident_id": incident_id})
    return {"success": True, "message": "Case closed and bed released."}

@router.post("/{facility_id}/capacity")
async def update_capacity(
    facility_id: int, 
    request: CapacityUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Hospital coordinator updates real-time bed count."""
    fac = db.query(VeterinaryFacility).filter_by(id=facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found.")
        
    fac.occupied_icu_beds = min(fac.total_icu_beds, max(0, request.occupied_icu_beds))
    fac.current_shelter_occupancy = min(fac.total_shelter_capacity, max(0, request.current_shelter_occupancy))
    fac.last_capacity_update = datetime.utcnow()
    db.commit()

    await manager.broadcast("CAPACITY_UPDATED", {
        "facility_id": fac.id,
        "available_icu_beds": fac.total_icu_beds - fac.occupied_icu_beds,
        "available_shelter_beds": fac.total_shelter_capacity - fac.current_shelter_occupancy,
        "timestamp": fac.last_capacity_update.isoformat()
    })
    return {"success": True, "available_icu": fac.total_icu_beds - fac.occupied_icu_beds}
