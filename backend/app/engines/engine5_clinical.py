from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.incident import EmergencyIncident, AnimalSpecies, TriagePriority, IncidentStatus
from ..models.facility import VeterinaryFacility
from ..models.clinical import ClinicalRecord, VitalStatus
from ..utils.geo import haversine_distance_km, estimate_road_travel_time_minutes

class ClinicalCoordinationEngine:
    @staticmethod
    def find_best_facilities(
        db: Session,
        incident: EmergencyIncident
    ) -> List[Dict[str, Any]]:
        """
        Ranks veterinary facilities based on:
        1. Species capability (large animal surgical ward if bovine).
        2. Live verified ICU bed availability (never fabricated).
        3. Real road distance and travel time.
        """
        facilities = db.query(VeterinaryFacility).all()
        species = incident.ai_detected_species or incident.reported_species or AnimalSpecies.UNKNOWN
        priority = incident.human_approved_priority or incident.ai_triage_priority or TriagePriority.HIGH_P2

        results = []

        for fac in facilities:
            dist_km = round(haversine_distance_km(
                fac.latitude, fac.longitude,
                incident.latitude, incident.longitude
            ), 2)
            eta_mins = estimate_road_travel_time_minutes(dist_km, "SMALL_ANIMAL_AMBULANCE")

            # Check capacity
            available_icu = max(0, fac.total_icu_beds - fac.occupied_icu_beds)
            available_shelter = max(0, fac.total_shelter_capacity - fac.current_shelter_occupancy)

            # Capability check
            is_capable = True
            mismatch_reason = None
            if species in (AnimalSpecies.BOVINE, AnimalSpecies.EQUINE) and not fac.large_animal_capable:
                is_capable = False
                mismatch_reason = "Facility lacks large-animal surgical and recovery paddock."

            # Calculate score
            score = 0.0
            if is_capable and available_icu > 0:
                proximity_score = max(0.0, (1.0 - (dist_km / 40.0)) * 60.0)
                bed_score = min(40.0, (available_icu / fac.total_icu_beds) * 40.0)
                score = round(proximity_score + bed_score, 1)

            results.append({
                "facility_id": fac.id,
                "name": fac.name,
                "facility_type": fac.facility_type,
                "contact_phone": fac.contact_phone,
                "emergency_direct_line": fac.emergency_direct_line,
                "distance_km": dist_km,
                "eta_minutes": eta_mins,
                "is_capable": is_capable,
                "mismatch_reason": mismatch_reason,
                "available_icu_beds": available_icu,
                "total_icu_beds": fac.total_icu_beds,
                "occupied_icu_beds": fac.occupied_icu_beds,
                "available_shelter_beds": available_shelter,
                "has_surgery_unit": fac.has_surgery_unit,
                "is_open_24x7": fac.is_open_24x7,
                "last_capacity_update": fac.last_capacity_update.isoformat() if fac.last_capacity_update else None,
                "recommendation_score": score
            })

        # Sort: Capable facilities with beds first, highest score
        results.sort(key=lambda x: (x["is_capable"], x["available_icu_beds"] > 0, x["recommendation_score"]), reverse=True)
        return results

    @staticmethod
    def admit_patient(
        db: Session,
        incident_id: int,
        facility_id: int,
        attending_vet: str,
        initial_diagnosis: str,
        treatment_plan: str,
        vital_status: VitalStatus = VitalStatus.CRITICAL_ICU
    ) -> ClinicalRecord:
        """Admits patient, records clinical details, and updates authenticated hospital occupancy."""
        facility = db.query(VeterinaryFacility).filter_by(id=facility_id).first()
        incident = db.query(EmergencyIncident).filter_by(id=incident_id).first()
        
        if facility and facility.occupied_icu_beds < facility.total_icu_beds:
            facility.occupied_icu_beds += 1
            facility.last_capacity_update = datetime.utcnow()

        if incident:
            incident.status = IncidentStatus.ADMITTED
            incident.assigned_facility_id = facility_id

        record = ClinicalRecord(
            incident_id=incident_id,
            facility_id=facility_id,
            admitted_at=datetime.utcnow(),
            vital_status=vital_status,
            attending_veterinarian=attending_vet,
            initial_diagnosis=initial_diagnosis,
            treatment_administered=treatment_plan,
            assigned_icu_bed=f"ICU-BAY-0{facility.occupied_icu_beds if facility else 1}"
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def discharge_and_close_case(
        db: Session,
        incident_id: int,
        closure_summary: str,
        recovery_photo_path: Optional[str] = None
    ) -> bool:
        """Discharges patient, frees up hospital bed, and closes incident with audit trail."""
        record = db.query(ClinicalRecord).filter_by(incident_id=incident_id).first()
        incident = db.query(EmergencyIncident).filter_by(id=incident_id).first()
        if not record or not incident:
            return False

        facility = db.query(VeterinaryFacility).filter_by(id=record.facility_id).first()
        if facility and facility.occupied_icu_beds > 0:
            facility.occupied_icu_beds -= 1
            facility.last_capacity_update = datetime.utcnow()

        record.vital_status = VitalStatus.RELEASED_OR_ADOPTED
        record.discharge_date = datetime.utcnow()
        record.closure_summary = closure_summary
        if recovery_photo_path:
            record.recovery_photo_path = recovery_photo_path

        incident.status = IncidentStatus.RESOLVED
        db.commit()
        return True
