"use client";

import React, { useState } from "react";
import { VeterinaryFacility, Incident, admitPatient, dischargePatient } from "@/lib/api";
import { 
  Cross, 
  Bed, 
  Activity, 
  CheckCircle2, 
  UserPlus, 
  FileText, 
  CheckSquare, 
  AlertTriangle,
  HeartPulse,
  Clock,
  Sparkles,
  PhoneCall,
  MapPin,
  Check,
  ArrowRight
} from "lucide-react";

interface VetProps {
  facilities: VeterinaryFacility[];
  incidents: Incident[];
  onRefresh: () => void;
}

const IN_PATIENTS = [
  {
    id: "IP-2026-081",
    species: "BOVINE",
    name: "Injured Calf (Porvorim)",
    bed: "Bed #1 (Large Animal Paddock)",
    admittedDate: "Today, 14:20",
    diagnosis: "Open metatarsal fracture, stabilized via external cast",
    surgeon: "Dr. Rohan Naik, B.V.Sc & A.H.",
    recoveryPct: 45,
    status: "POST_OP_OBSERVATION",
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "IP-2026-079",
    species: "CANINE",
    name: "Indie Stray (Assagao)",
    bed: "Bed #2 (ICU Small Animal)",
    admittedDate: "Yesterday, 18:40",
    diagnosis: "Severe dehydration and laceration, IV fluid therapy complete",
    surgeon: "Dr. Ananya Prabhu, M.V.Sc (Surgery)",
    recoveryPct: 85,
    status: "READY_FOR_RELEASE",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "IP-2026-075",
    species: "EQUINE",
    name: "Working Beach Pony (Mandrem)",
    bed: "Bed #3 (Equine Stable)",
    admittedDate: "2 days ago",
    diagnosis: "Hoof abscess drainage and antibiotic course",
    surgeon: "Dr. Vikram Sardessai, Chief Vet Officer",
    recoveryPct: 70,
    status: "RECOVERING",
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=80"
  }
];

export default function VeterinaryDashboard({
  facilities,
  incidents,
  onRefresh,
}: VetProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(facilities[0]?.id || 1);
  const [admittingIncident, setAdmittingIncident] = useState<Incident | null>(null);
  
  // Admission Form State
  const [vetName, setVetName] = useState("Dr. Rohan Naik (Senior Orthopedic Surgeon)");
  const [diagnosis, setDiagnosis] = useState("Compound metatarsal fracture with contaminated open wound. Stabilized under local anesthesia.");
  const [treatmentPlan, setTreatmentPlan] = useState("IV Ceftriaxone, analgesia, daily wound dressing, scheduled for external fixation in Large Animal OT.");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const currentFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  const incomingCasualties = incidents.filter(
    (i) => ["DISPATCHED", "EN_ROUTE", "ON_SCENE", "IN_TRANSIT"].includes(i.status)
  );

  const activeAdmitted = incidents.filter((i) => i.status === "ADMITTED");

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admittingIncident) return;
    setSubmitting(true);
    try {
      await admitPatient(
        admittingIncident.id,
        currentFacility.id,
        vetName,
        diagnosis,
        treatmentPlan
      );
      setStatusMsg(`Patient ${admittingIncident.tracking_number} admitted to ${currentFacility.name}!`);
      setAdmittingIncident(null);
      onRefresh();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      alert("Admission confirmed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (incidentId: number) => {
    const summary = prompt("Enter patient discharge and habitat release summary:", "Wound healed, animal active, released back to community habitat.");
    if (!summary) return;
    try {
      await dischargePatient(incidentId, summary);
      setStatusMsg("Patient discharged and ICU bed released in CAD system!");
      onRefresh();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      alert("Discharge confirmed.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 pb-20">
      {/* 1. Hospital Identity Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80" 
              alt={currentFacility?.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 bg-purple-600 text-white p-1 rounded-md">
              <Cross className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{currentFacility?.name}</h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                GOVERNMENT POLYCLINIC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center flex-wrap gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{currentFacility?.address} • Taluka: <b className="text-slate-700">{currentFacility?.taluka}</b> • Hotline: <b className="text-purple-700">{currentFacility?.contact_phone}</b></span>
            </p>
          </div>
        </div>

        {/* Facility Selector */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Switch Facility:</label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-2xl px-4 py-3 outline-none focus:border-purple-600 cursor-pointer shadow-xs"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name.split(",")[0]} ({f.total_icu_beds - f.occupied_icu_beds} Beds Free)
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 2. Real-Time Ward & Bed Capacity Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Available ICU Beds</div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
            {currentFacility?.total_icu_beds - currentFacility?.occupied_icu_beds} <span className="text-sm text-slate-400 font-normal">/ {currentFacility?.total_icu_beds}</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified Live Telemetry</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Large Animal Paddock</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Ready</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Hydraulic Hoist Compliant</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Shelter Pen Capacity</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{currentFacility?.available_shelter_capacity} Free</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Total 50 Pens</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Incoming Casualties</div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
            {incomingCasualties.length} En Route
          </div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">Pre-Arrival Radar Active</div>
        </div>
      </div>

      {/* 3. Interactive 8-Slot ICU Bed Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Bed className="w-4 h-4 text-purple-600" />
            <span>Interactive ICU Bed & Paddock Occupancy Matrix</span>
          </h2>
          <span className="text-xs text-slate-500">
            5 Beds Sterilized & Ready for Inbound Animals
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { num: 1, status: "OCCUPIED", animal: "Bovine Calf", badge: "P1" },
            { num: 2, status: "OCCUPIED", animal: "Indie Dog", badge: "P2" },
            { num: 3, status: "OCCUPIED", animal: "Beach Pony", badge: "P2" },
            { num: 4, status: "FREE", animal: "ICU Available", badge: "READY" },
            { num: 5, status: "FREE", animal: "ICU Available", badge: "READY" },
            { num: 6, status: "FREE", animal: "ICU Available", badge: "READY" },
            { num: 7, status: "FREE", animal: "ICU Available", badge: "READY" },
            { num: 8, status: "FREE", animal: "ICU Available", badge: "READY" }
          ].map((bed) => (
            <div
              key={bed.num}
              className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                bed.status === "OCCUPIED"
                  ? "bg-purple-50/70 border-purple-200 text-purple-900"
                  : "bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              <div className="text-xs font-black">Bed #{bed.num}</div>
              <div className="text-[10px] font-bold line-clamp-1">{bed.animal}</div>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                bed.status === "OCCUPIED" ? "bg-purple-200 text-purple-800" : "bg-emerald-200 text-emerald-800"
              }`}>
                {bed.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Incoming Pre-Arrival Casualties (Radar) */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-red-600 animate-spin" />
          <span>Inbound Casualties En Route to this Polyclinic</span>
        </h2>

        {incomingCasualties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingCasualties.map((inc) => (
              <div key={inc.id} className="bg-white rounded-3xl border border-red-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=400&q=80" 
                      alt="Incoming casualty" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                        {inc.ai_triage_priority.replace("_", " ")}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {inc.tracking_number}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {inc.ai_detected_species || inc.reported_species} from Porvorim
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Status: <b className="text-red-600">{inc.status}</b> • ETA ~10.9 mins
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Ambulance: AH-CATTLE-HOIST-01</span>
                  <button
                    onClick={() => setAdmittingIncident(inc)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Admit Patient to Ward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 font-medium">
            No incoming ambulance casualties currently flagged for this hospital.
          </div>
        )}
      </div>

      {/* 5. Modal: Admit Patient Form */}
      {admittingIncident && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              Admit Patient {admittingIncident.tracking_number}
            </h3>
            <p className="text-xs text-slate-500">
              Enter clinical case sheet details to assign an ICU bed and trigger daily surgical monitoring.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Attending Veterinary Surgeon:</label>
              <input
                type="text"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium outline-none focus:border-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Clinical Diagnosis:</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium outline-none focus:border-purple-600 h-20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Prescribed Treatment Plan:</label>
              <textarea
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium outline-none focus:border-purple-600 h-20"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAdmittingIncident(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {submitting ? "Admitting..." : "Confirm Admission"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Active In-Patient Ward Roster with Photos & Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Active In-Patient Ward & Surgical Recovery Roster</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">3 Animals Currently Under Care</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {IN_PATIENTS.map((pt) => (
            <div key={pt.id} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="h-40 overflow-hidden relative">
                  <img src={pt.image} alt={pt.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                    {pt.id}
                  </span>
                  <span className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pt.bed.split("(")[0]}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{pt.name}</h3>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">Surgeon: {pt.surgeon}</div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {pt.diagnosis}
                  </p>

                  {/* Recovery Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Healing & Rehabilitation:</span>
                      <span className="text-purple-700">{pt.recoveryPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all" 
                        style={{ width: `${pt.recoveryPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => alert(`Release Certificate generated for ${pt.name}. Coordinated with Goa Animal Welfare Board.`)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Release to Community Habitat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}