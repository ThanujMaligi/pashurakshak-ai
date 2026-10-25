import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.database import SessionLocal
from app.models import EmergencyIncident, AnimalSpecies, TriagePriority
from app.engines import DeduplicationEngine

db = SessionLocal()

# Add a second incident near Porvorim junction (100m away)
inc2 = EmergencyIncident(
    tracking_number="PASHU-TEST-002",
    citizen_phone="+919811122233",
    citizen_name="Passing Commuter",
    latitude=15.5348, # ~80m away from 15.5342
    longitude=73.8294,
    address_text="NH66 highway near Porvorim flyover",
    taluka="Bardez",
    reported_species=AnimalSpecies.BOVINE,
    ai_detected_species=AnimalSpecies.BOVINE,
    ai_triage_priority=TriagePriority.CRITICAL_P1,
    status="REPORTED"
)
db.add(inc2)
db.commit()

# Now run deduplication check for incident 2 against existing incidents
dups = DeduplicationEngine.find_duplicate_candidates(
    db=db,
    latitude=inc2.latitude,
    longitude=inc2.longitude,
    created_at=inc2.created_at,
    exclude_incident_id=inc2.id
)

print(f"Deduplication test: Found {len(dups)} duplicate clusters!")
for d in dups:
    print(f" -> Candidate {d['tracking_number']}: Distance={d['distance_meters']}m, TimeDiff={d['time_diff_minutes']}m, ProbableDup={d['is_probable_duplicate']}, Score={d['composite_score']}")

db.close()
