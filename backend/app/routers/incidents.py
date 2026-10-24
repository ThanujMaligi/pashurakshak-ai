import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    EmergencyIncident, 
    IncidentMedia, 
    IncidentStatus, 
    TriagePriority, 
    AnimalSpecies,
    AuditLog
)
from ..schemas.incident import IncidentResponse, IncidentOverrideRequest, DuplicateMergeRequest
from ..engines import CitizenIntakeEngine, AITriageEngine, DeduplicationEngine
from ..utils.security import mask_phone_number
from .websocket import manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.post("/report")
async def report_incident(
    citizen_phone: str = Form(...),
    citizen_name: Optional[str] = Form("Goa Commuter"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address_text: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    reported_species: str = Form("UNKNOWN"),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Multimodal Citizen Intake Endpoint:
    Accepts GPS, photo, and voice recording. Triggers AI Computer Vision triage
    and Spatio-Temporal Deduplication checks.
    """
    image_bytes = await image.read() if image else None
    image_filename = image.filename if image else None
    audio_bytes = await audio.read() if audio else None
    audio_filename = audio.filename if audio else None

    # 1. Process Intake (Save files, extract EXIF GPS, compute pHash)
    intake_data = CitizenIntakeEngine.process_submission(
        citizen_phone=citizen_phone,
        citizen_name=citizen_name,
        latitude=latitude,
        longitude=longitude,
        address_text=address_text,
        landmark=landmark,
        reported_species=reported_species,
        image_bytes=image_bytes,
        image_filename=image_filename,
        audio_bytes=audio_bytes,
        audio_filename=audio_filename
    )

    # 2. Map Reported Species Enum
    try:
        species_enum = AnimalSpecies(intake_data["reported_species"].upper())
    except Exception:
        species_enum = AnimalSpecies.UNKNOWN

    # 3. Create Incident Record in Database
    incident = EmergencyIncident(
        tracking_number=intake_data["tracking_number"],
        citizen_phone=intake_data["citizen_phone"],
        citizen_name=intake_data["citizen_name"],
        latitude=intake_data["latitude"],
        longitude=intake_data["longitude"],
        address_text=intake_data["address_text"],
        landmark=intake_data["landmark"],
        taluka=intake_data["taluka"],
        reported_species=species_enum,
        status=IncidentStatus.REPORTED,
        primary_media_phash=intake_data["phash"]
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # 4. Save Media Records & Run AI Ingestion
    media_record = None
    ai_results = None
    audio_results = None

    if intake_data["image_path"]:
        # Execute Computer Vision Triage
        ai_results = AITriageEngine.analyze_image(intake_data["image_path"])
        
        media_record = IncidentMedia(
            incident_id=incident.id,
            media_type="IMAGE",
            file_path=intake_data["image_path"],
            file_name=os.path.basename(intake_data["image_path"]),
            phash=intake_data["phash"],
            ai_inference_time_ms=ai_results.get("inference_time_ms")
        )
        db.add(media_record)

        # Update Incident with AI Assessment
        incident.ai_detected_species = ai_results["detected_species"]
        incident.ai_species_confidence = ai_results["species_confidence"]
        incident.ai_triage_priority = ai_results["advisory_priority"]
        incident.ai_triage_reason = ai_results["advisory_reason"]
        incident.status = IncidentStatus.AI_TRIAGED

    if intake_data["audio_path"]:
        # Execute Whisper Audio Transcription
        audio_results = AITriageEngine.transcribe_audio(intake_data["audio_path"])
        aud_media = IncidentMedia(
            incident_id=incident.id,
            media_type="AUDIO",
            file_path=intake_data["audio_path"],
            file_name=os.path.basename(intake_data["audio_path"]),
            transcription=audio_results.get("transcription"),
            transcription_language=audio_results.get("language"),
            transcription_confidence=audio_results.get("confidence")
        )
        db.add(aud_media)

    # 5. Execute Deduplication Engine against active cases
    duplicate_candidates = DeduplicationEngine.find_duplicate_candidates(
        db=db,
        latitude=incident.latitude,
        longitude=incident.longitude,
        created_at=incident.created_at,
        phash_str=intake_data["phash"],
        exclude_incident_id=incident.id
    )

    probable_dups = [d for d in duplicate_candidates if d["is_probable_duplicate"]]
    if probable_dups:
        top_match = probable_dups[0]
        incident.duplicate_cluster_id = f"CLUSTER-{top_match['candidate_id']}"
        incident.distance_to_parent_meters = top_match["distance_meters"]
        incident.time_diff_parent_minutes = top_match["time_diff_minutes"]

    # 6. Audit Log
    audit = AuditLog(
        action="INCIDENT_REPORTED",
        entity_type="INCIDENT",
        entity_id=incident.id,
        user_identifier=f"CITIZEN:{mask_phone_number(citizen_phone)}",
        details_json=f"Species: {species_enum.value}, Triage: {incident.ai_triage_priority.value}"
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    # 7. Real-Time Broadcast to Command Center CAD
    incident_dict = format_incident_response(incident)
    await manager.broadcast("INCIDENT_NEW", {
        "incident": incident_dict,
        "duplicate_warnings": duplicate_candidates[:3]
    })

    return {
        "success": True,
        "tracking_number": incident.tracking_number,
        "incident_id": incident.id,
        "advisory_priority": incident.ai_triage_priority.value,
        "detected_species": incident.ai_detected_species.value if incident.ai_detected_species else "UNKNOWN",
        "duplicate_alert": len(probable_dups) > 0,
        "duplicate_matches": duplicate_candidates[:2],
        "message": "Emergency report registered in Goa CAD system. Responders alerted."
    }

@router.get("", response_model=List[dict])
def get_all_incidents(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    taluka_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EmergencyIncident).order_by(EmergencyIncident.created_at.desc())
    if status_filter:
        query = query.filter(EmergencyIncident.status == status_filter)
    if priority_filter:
        query = query.filter(EmergencyIncident.ai_triage_priority == priority_filter)
    if taluka_filter:
        query = query.filter(EmergencyIncident.taluka == taluka_filter)
    
    incidents = query.limit(100).all()
    return [format_incident_response(inc) for inc in incidents]

@router.get("/track/{tracking_number}")
def track_incident(tracking_number: str, db: Session = Depends(get_db)):
    """Public citizen case tracking endpoint."""
    inc = db.query(EmergencyIncident).filter_by(tracking_number=tracking_number).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident tracking number not found.")
    return format_incident_response(inc)

@router.get("/{incident_id}/duplicates")
def get_incident_duplicates(incident_id: int, db: Session = Depends(get_db)):
    """Fetches candidate duplicate reports for a given incident."""
    inc = db.query(EmergencyIncident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    
    candidates = DeduplicationEngine.find_duplicate_candidates(
        db=db,
        latitude=inc.latitude,
        longitude=inc.longitude,
        created_at=inc.created_at,
        phash_str=inc.primary_media_phash,
        exclude_incident_id=inc.id
    )
    return {"incident_id": incident_id, "candidates": candidates}

@router.post("/merge-duplicate")
async def merge_duplicate(request: DuplicateMergeRequest, db: Session = Depends(get_db)):
    """Merges a duplicate incident into a master incident."""
    # Find child incident
    success = DeduplicationEngine.merge_into_master_incident(
        db=db,
        duplicate_incident_id=request.master_incident_id, # handled in controller
        master_incident_id=request.master_incident_id,
        dispatcher_notes=request.dispatcher_notes
    )
    return {"success": success}

@router.post("/{incident_id}/override")
async def override_priority(
    incident_id: int, 
    request: IncidentOverrideRequest, 
    db: Session = Depends(get_db)
):
    """Human-in-the-Loop priority override."""
    inc = db.query(EmergencyIncident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    inc.human_approved_priority = request.approved_priority
    inc.human_override_notes = request.override_notes
    db.commit()

    await manager.broadcast("INCIDENT_UPDATED", format_incident_response(inc))
    return {"success": True, "new_priority": inc.human_approved_priority.value}

def format_incident_response(inc: EmergencyIncident) -> dict:
    media_list = []
    for m in inc.media:
        media_list.append({
            "id": m.id,
            "media_type": m.media_type,
            "file_name": m.file_name,
            "transcription": m.transcription,
            "inference_time_ms": m.ai_inference_time_ms
        })

    return {
        "id": inc.id,
        "tracking_number": inc.tracking_number,
        "citizen_phone_masked": mask_phone_number(inc.citizen_phone),
        "citizen_name": inc.citizen_name,
        "latitude": inc.latitude,
        "longitude": inc.longitude,
        "address_text": inc.address_text,
        "landmark": inc.landmark,
        "taluka": inc.taluka,
        "reported_species": inc.reported_species.value if inc.reported_species else "UNKNOWN",
        "ai_detected_species": inc.ai_detected_species.value if inc.ai_detected_species else "UNKNOWN",
        "ai_species_confidence": inc.ai_species_confidence,
        "ai_triage_priority": inc.ai_triage_priority.value if inc.ai_triage_priority else "P2_HIGH",
        "ai_triage_reason": inc.ai_triage_reason,
        "human_approved_priority": inc.human_approved_priority.value if inc.human_approved_priority else None,
        "status": inc.status.value if inc.status else "REPORTED",
        "is_duplicate": inc.is_duplicate,
        "parent_incident_id": inc.parent_incident_id,
        "assigned_unit_id": inc.assigned_unit_id,
        "assigned_facility_id": inc.assigned_facility_id,
        "created_at": inc.created_at.isoformat() if inc.created_at else None,
        "media": media_list
    }
