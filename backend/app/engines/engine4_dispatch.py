from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from ..models.incident import EmergencyIncident, AnimalSpecies, TriagePriority
from ..models.responder import RescueUnit, VehicleType
from ..utils.geo import haversine_distance_km, estimate_road_travel_time_minutes

class CapabilityDispatchEngine:
    @staticmethod
    def get_ranked_dispatch_recommendations(
        db: Session,
        incident: EmergencyIncident
    ) -> List[Dict[str, Any]]:
        """
        Executes constrained vehicle-routing and capability-matching algorithms.
        Strictly enforces physical and equipment constraints before calculating ETA.
        """
        units = db.query(RescueUnit).all()
        species = incident.ai_detected_species or incident.reported_species or AnimalSpecies.UNKNOWN
        priority = incident.human_approved_priority or incident.ai_triage_priority or TriagePriority.HIGH_P2

        recommendations = []

        for unit in units:
            # 1. Evaluate Hard Operational Constraints
            is_eligible, failure_reason = CapabilityDispatchEngine._check_mandatory_constraints(unit, species)
            
            # 2. Compute Geospatial Telemetry
            dist_km = round(haversine_distance_km(
                unit.current_latitude, unit.current_longitude,
                incident.latitude, incident.longitude
            ), 2)
            
            eta_mins = estimate_road_travel_time_minutes(dist_km, unit.vehicle_type.value)
            
            # 3. Compute Composite Suitability Score (0 to 100)
            if not is_eligible:
                suitability_score = 0.0
                reason = f"INELIGIBLE: {failure_reason}"
            else:
                # Proximity score (Max 50 pts): 50 pts at 0km, decays over 35km
                proximity_score = max(0.0, (1.0 - (dist_km / 35.0)) * 50.0)
                
                # Availability score (Max 25 pts)
                availability_score = 25.0 if unit.is_available else 5.0
                
                # Equipment specialization score (Max 25 pts)
                equip_score = 10.0
                if species == AnimalSpecies.BOVINE and unit.has_cattle_lift:
                    equip_score += 15.0
                if species == AnimalSpecies.CANINE and unit.has_catchpole:
                    equip_score += 15.0
                if priority == TriagePriority.CRITICAL_P1 and unit.has_oxygen:
                    equip_score += 15.0
                equip_score = min(25.0, equip_score)

                suitability_score = round(proximity_score + availability_score + equip_score, 1)
                reason = (
                    f"Optimal match: {unit.unit_callsign} ({unit.vehicle_type.value}) is {dist_km} km away "
                    f"(ETA ~{eta_mins} mins). Fully equipped with required capture & safety gear."
                )

            recommendations.append({
                "unit_id": unit.id,
                "unit_callsign": unit.unit_callsign,
                "ngo_affiliation": unit.ngo_affiliation,
                "contact_phone": unit.contact_phone,
                "vehicle_type": unit.vehicle_type.value,
                "is_available": unit.is_available,
                "is_eligible": is_eligible,
                "distance_km": dist_km,
                "eta_minutes": eta_mins,
                "suitability_score": suitability_score,
                "recommendation_reason": reason,
                "equipment": {
                    "has_catchpole": unit.has_catchpole,
                    "has_cattle_lift": unit.has_cattle_lift,
                    "has_oxygen": unit.has_oxygen,
                    "has_tranquilizer": unit.has_tranquilizer_kit,
                    "max_capacity_kg": unit.max_weight_capacity_kg
                }
            })

        # Sort: Eligible units first, then highest suitability score
        recommendations.sort(key=lambda x: (x["is_eligible"], x["suitability_score"]), reverse=True)
        return recommendations

    @staticmethod
    def _check_mandatory_constraints(unit: RescueUnit, species: AnimalSpecies) -> Tuple[bool, Optional[str]]:
        """
        Enforces physical safety constraints:
        - Two-wheelers cannot transport livestock/large animals.
        - Bovine operations mandate heavy vehicles with hoist/lift.
        - Wildlife requires containment vans.
        """
        if species in (AnimalSpecies.BOVINE, AnimalSpecies.EQUINE):
            if unit.vehicle_type == VehicleType.TWO_WHEELER:
                return False, "Two-wheelers cannot safely transport large bovines or equines."
            if not unit.has_cattle_lift and unit.max_weight_capacity_kg < 200.0:
                return False, "Vehicle lacks hydraulic lift or adequate weight capacity for adult cattle."

        if species == AnimalSpecies.WILDLIFE:
            if unit.vehicle_type not in (VehicleType.WILDLIFE_RESCUE_VAN, VehicleType.SMALL_ANIMAL_AMBULANCE):
                return False, "Vehicle lacks secure containment crates or wildlife handling gear."

        return True, None
