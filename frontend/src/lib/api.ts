export const API_BASE = "http://127.0.0.1:8000/api/v1";
export const WS_BASE = "ws://127.0.0.1:8000/ws/cad";

export interface Incident {
  id: number;
  tracking_number: string;
  citizen_phone_masked: string;
  citizen_name: string;
  latitude: number;
  longitude: number;
  address_text: string;
  landmark?: string;
  taluka: string;
  reported_species: string;
  ai_detected_species?: string;
  ai_species_confidence?: number;
  ai_triage_priority: "P1_CRITICAL" | "P2_HIGH" | "P3_MODERATE" | "P4_ROUTINE";
  ai_triage_reason?: string;
  human_approved_priority?: string;
  status: string;
  is_duplicate: boolean;
  parent_incident_id?: number;
  assigned_unit_id?: number;
  assigned_facility_id?: number;
  created_at: string;
  media: Array<{
    id: number;
    media_type: string;
    file_name: string;
    transcription?: string;
    inference_time_ms?: number;
  }>;
}

export interface RescueUnit {
  id: number;
  unit_callsign: string;
  ngo_affiliation: string;
  contact_phone: string;
  vehicle_type: string;
  max_weight_capacity_kg: number;
  has_catchpole: boolean;
  has_cattle_lift: boolean;
  has_oxygen: boolean;
  has_tranquilizer_kit: boolean;
  current_latitude: number;
  current_longitude: number;
  operating_taluka: string;
  is_available: boolean;
  status_text: string;
  last_ping: string;
}

export interface VeterinaryFacility {
  id: number;
  name: string;
  facility_type: string;
  address: string;
  taluka: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  emergency_direct_line?: string;
  has_surgery_unit: boolean;
  large_animal_capable: boolean;
  total_icu_beds: number;
  occupied_icu_beds: number;
  available_icu_beds: number;
  total_shelter_capacity: number;
  current_shelter_occupancy: number;
  available_shelter_beds: number;
  is_open_24x7: boolean;
  is_verified_partner: boolean;
  last_capacity_update: string;
}

export async function reportIncident(formData: FormData) {
  const res = await fetch(`${API_BASE}/incidents/report`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to submit incident report");
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function trackIncident(trackingNumber: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/track/${trackingNumber}`);
  if (!res.ok) throw new Error("Incident not found");
  return res.json();
}

export async function fetchRecommendations(incidentId: number) {
  const res = await fetch(`${API_BASE}/dispatch/recommendations/${incidentId}`);
  if (!res.ok) throw new Error("Failed to fetch dispatch recommendations");
  return res.json();
}

export async function assignUnit(incidentId: number, rescueUnitId: number, notes?: string) {
  const res = await fetch(`${API_BASE}/dispatch/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incident_id: incidentId, rescue_unit_id: rescueUnitId, notes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to assign rescue unit");
  }
  return res.json();
}

export async function updateAssignmentStatus(
  assignmentId: number,
  status: string,
  fieldNotes?: string,
  coords?: { latitude: number; longitude: number }
) {
  const res = await fetch(`${API_BASE}/dispatch/assignments/${assignmentId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      field_notes: fieldNotes,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function fetchUnits(): Promise<RescueUnit[]> {
  const res = await fetch(`${API_BASE}/dispatch/units`);
  if (!res.ok) throw new Error("Failed to fetch rescue units");
  return res.json();
}

export async function fetchFacilities(): Promise<VeterinaryFacility[]> {
  const res = await fetch(`${API_BASE}/facilities`);
  if (!res.ok) throw new Error("Failed to fetch facilities");
  return res.json();
}

export async function admitPatient(
  incidentId: number,
  facilityId: number,
  attendingVet: string,
  initialDiagnosis: string,
  treatmentPlan: string
) {
  const res = await fetch(`${API_BASE}/facilities/admit/${incidentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      facility_id: facilityId,
      attending_vet: attendingVet,
      initial_diagnosis: initialDiagnosis,
      treatment_plan: treatmentPlan,
      vital_status: "CRITICAL_ICU",
    }),
  });
  if (!res.ok) throw new Error("Failed to admit patient");
  return res.json();
}

export async function dischargePatient(incidentId: number, closureSummary: string) {
  const res = await fetch(`${API_BASE}/facilities/discharge/${incidentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      closure_summary: closureSummary,
      vital_status: "RELEASED_OR_ADOPTED",
    }),
  });
  if (!res.ok) throw new Error("Failed to discharge patient");
  return res.json();
}

export async function fetchAnalyticsSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function fetchHotspots() {
  const res = await fetch(`${API_BASE}/analytics/hotspots`);
  if (!res.ok) throw new Error("Failed to fetch hotspots");
  return res.json();
}

export async function overridePriority(incidentId: number, priority: string, notes: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved_priority: priority, override_notes: notes }),
  });
  if (!res.ok) throw new Error("Failed to override priority");
  return res.json();
}
