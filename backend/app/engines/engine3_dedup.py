import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

try:
    import imagehash
except ImportError:
    imagehash = None

from ..config import settings
from ..models.incident import EmergencyIncident, IncidentStatus
from ..utils.geo import haversine_distance_meters

class DeduplicationEngine:
    @staticmethod
    def find_duplicate_candidates(
        db: Session,
        latitude: float,
        longitude: float,
        created_at: datetime,
        phash_str: Optional[str] = None,
        exclude_incident_id: Optional[int] = None,
        radius_meters: float = settings.DEDUP_SPATIAL_RADIUS_METERS,
        time_window_hours: float = settings.DEDUP_TIME_WINDOW_HOURS
    ) -> List[Dict[str, Any]]:
        """
        Executes genuine spatio-temporal clustering against active incidents in database.
        Calculates:
        1. Exact geospatial distance in meters via Haversine.
        2. Exact time delta in minutes.
        3. Visual perceptual hash Hamming distance (if media available).
        """
        cutoff_time = created_at - timedelta(hours=time_window_hours)
        
        # Query active, non-duplicate incidents within time window
        query = db.query(EmergencyIncident).filter(
            EmergencyIncident.created_at >= cutoff_time,
            EmergencyIncident.is_duplicate == False
        )
        if exclude_incident_id:
            query = query.filter(EmergencyIncident.id != exclude_incident_id)

        candidates = query.all()
        matches = []

        for candidate in candidates:
            # 1. Spatial distance calculation
            dist_m = haversine_distance_meters(latitude, longitude, candidate.latitude, candidate.longitude)
            if dist_m > radius_meters:
                continue # Outside spatial cluster threshold

            # 2. Time difference calculation
            time_diff_seconds = abs((created_at - candidate.created_at).total_seconds())
            time_diff_minutes = round(time_diff_seconds / 60.0, 1)

            # 3. Perceptual Image Similarity
            image_similarity_pct = None
            hamming_dist = None
            if phash_str and candidate.primary_media_phash and imagehash is not None:
                try:
                    h1 = imagehash.hex_to_hash(phash_str)
                    h2 = imagehash.hex_to_hash(candidate.primary_media_phash)
                    hamming_dist = h1 - h2
                    # Normalized similarity (0 to 100%)
                    image_similarity_pct = round(max(0.0, (1.0 - (hamming_dist / 64.0)) * 100.0), 1)
                except Exception:
                    pass

            # Calculate composite duplication score (0.0 to 1.0)
            spatial_score = max(0.0, 1.0 - (dist_m / radius_meters))
            temporal_score = max(0.0, 1.0 - (time_diff_seconds / (time_window_hours * 3600.0)))
            
            if image_similarity_pct is not None:
                # 40% spatial + 25% temporal + 35% visual
                composite_score = (spatial_score * 0.40) + (temporal_score * 0.25) + ((image_similarity_pct / 100.0) * 0.35)
            else:
                # 60% spatial + 40% temporal
                composite_score = (spatial_score * 0.60) + (temporal_score * 0.40)

            # Strong duplicate threshold: composite score >= 0.60
            matches.append({
                "candidate_id": candidate.id,
                "tracking_number": candidate.tracking_number,
                "reported_species": candidate.reported_species.value if candidate.reported_species else "UNKNOWN",
                "status": candidate.status.value,
                "distance_meters": round(dist_m, 1),
                "time_diff_minutes": time_diff_minutes,
                "image_similarity_pct": image_similarity_pct,
                "hamming_distance": hamming_dist,
                "composite_score": round(composite_score, 3),
                "is_probable_duplicate": composite_score >= 0.55
            })

        # Sort highest composite score first
        matches.sort(key=lambda x: x["composite_score"], reverse=True)
        return matches

    @staticmethod
    def merge_into_master_incident(
        db: Session,
        duplicate_incident_id: int,
        master_incident_id: int,
        dispatcher_notes: str
    ) -> bool:
        """Links the duplicate ticket to master incident and updates case state."""
        duplicate = db.query(EmergencyIncident).filter_by(id=duplicate_incident_id).first()
        master = db.query(EmergencyIncident).filter_by(id=master_incident_id).first()
        if not duplicate or not master:
            return False

        dist_m = haversine_distance_meters(
            duplicate.latitude, duplicate.longitude,
            master.latitude, master.longitude
        )
        time_diff_m = round(abs((duplicate.created_at - master.created_at).total_seconds()) / 60.0, 1)

        duplicate.is_duplicate = True
        duplicate.parent_incident_id = master.id
        duplicate.distance_to_parent_meters = round(dist_m, 1)
        duplicate.time_diff_parent_minutes = time_diff_m
        duplicate.status = IncidentStatus.MERGED_DUPLICATE
        duplicate.human_override_notes = f"Merged into {master.tracking_number}. Notes: {dispatcher_notes}"

        db.commit()
        return True
