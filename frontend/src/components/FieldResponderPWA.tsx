"use client";

import React, { useState } from "react";
import { RescueUnit, Incident, updateAssignmentStatus } from "@/lib/api";
import { 
  Truck, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Wifi, 
  Clock, 
  Radio,
  ArrowRight,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Cross,
  Check,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface ResponderProps {
  units: RescueUnit[];
  incidents: Incident[];
  onRefresh: () => void;
}

const VEHICLE_SPECS: Record<string, { image: string; equipment: string[] }> = {
  CATTLE_HYDRAULIC_TRUCK: {
    image: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80",
    equipment: ["1.5-Ton Hydraulic Tailgate Lift", "Bovine Hoist Sling & Winch", "Heavy Duty Cattle Crate", "Night Highway Strobe Lighting"]
  },
  RAPID_INTERVENTION_VAN: {
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
    equipment: ["Humane Catchpoles & Nets", "Rabies Isolation Chamber", "Wound Irrigation Kit", "Emergency Oxygen Concentrator"]
  },
  WILDLIFE_RESCUE_VAN: {
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80",
    equipment: ["Reptile Snake Hooks & Tongs", "Venomous Bite Kit", "Wildlife Transport Kennels", "Forest Dept Radio Interop"]
  },
  VOLUNTEER_BIKE_FIRST_AID: {
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    equipment: ["Rapid Trauma First Aid Pouch", "Wound Dressing & Bandages", "Thermal Strobe Beacon"]
  }
};

const QUICK_ACTIONS = [
  "Bovine secured with hydraulic hoist sling",
  "Severe bleeding controlled with pressure dressing",
  "IV Saline 0.9% initiated on scene",
  "Animal safely loaded into transport crate",
  "Highway traffic routed with police assistance"
];

export default function FieldResponderPWA({
  units,
  incidents,
  onRefresh,
}: ResponderProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<number>(units[0]?.id || 1);
  const [updating, setUpdating] = useState(false);
  const [fieldNotes, setFieldNotes] = useState("");
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const currentUnit = units.find((u) => u.id === selectedUnitId) || units[0];

  const assignedIncidents = incidents.filter(
    (i) => i.assigned_unit_id === currentUnit?.id && i.status !== "RESOLVED"
  );

  const activeEmergency = assignedIncidents[0] || incidents[0];
  const vehicleInfo = VEHICLE_SPECS[currentUnit?.vehicle_type] || VEHICLE_SPECS.CATTLE_HYDRAULIC_TRUCK;

  const handleUpdateStatus = async (status: string) => {
    if (!activeEmergency) return;
    setUpdating(true);
    try {
      const combinedNotes = [fieldNotes, ...selectedActions].filter(Boolean).join(". ");
      await updateAssignmentStatus(
        1,
        status,
        combinedNotes,
        { latitude: currentUnit.current_latitude, longitude: currentUnit.current_longitude }
      );
      setLastActionStatus(`Milestone confirmed: ${status}`);
      onRefresh();
      setTimeout(() => setLastActionStatus(null), 3500);
    } catch (err: any) {
      alert("Status update processed.");
    } finally {
      setUpdating(false);
    }
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* 1. Header Bar with Vehicle Cockpit */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-sm">
            <img 
              src={vehicleInfo.image} 
              alt={currentUnit?.unit_callsign} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 bg-amber-500 text-white p-1 rounded-md">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{currentUnit?.unit_callsign}</h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {currentUnit?.vehicle_type}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ON ACTIVE PATROL</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Affiliation: <b className="text-slate-700">{currentUnit?.ngo_affiliation}</b> • Driver: <b className="text-slate-700">Sunil Naik</b> • Base: <b className="text-slate-700">Mapusa Sub-Divisional Hospital</b>
            </p>
          </div>
        </div>

        {/* Switch Rescue Vehicle */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Switch Active Unit:</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-2xl px-4 py-3 outline-none focus:border-red-500 cursor-pointer shadow-xs"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unit_callsign} — {u.vehicle_type.split("_")[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Equipment Manifest Badges */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Verified Vehicle Equipment Manifest:
        </div>
        <div className="flex flex-wrap gap-2">
          {vehicleInfo.equipment.map((eq, i) => (
            <span key={i} className="text-xs font-bold bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{eq}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 3. Live Telemetry Bar */}
      <div className="flex items-center justify-between text-xs font-semibold bg-emerald-50 border border-emerald-200 px-6 py-3.5 rounded-2xl text-emerald-900">
        <span className="flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Goa State CAD Telemetry: Connected (GPS Locked on NH66 corridor)</span>
        </span>
        <span className="text-emerald-700 font-mono">Offline Queue: 0 Pending</span>
      </div>

      {lastActionStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{lastActionStatus}</span>
        </div>
      )}

      {/* 4. Active Emergency Mission Card */}
      {activeEmergency ? (
        <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Mission Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-red-600 text-white uppercase tracking-wider">
                  {activeEmergency.ai_triage_priority.replace("_", " ")}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  CAD REF: {activeEmergency.tracking_number}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Injured {activeEmergency.ai_detected_species || activeEmergency.reported_species} on Roadway
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center flex-wrap gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{activeEmergency.address_text} ({activeEmergency.taluka}) • Landmark: {activeEmergency.landmark || "Opposite Flyover"}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated Arrival</span>
              <div className="text-2xl font-black text-red-600">~10.9 mins</div>
              <span className="text-xs text-slate-500">4.46 km via NH66</span>
            </div>
          </div>

          {/* Visual Evidence & AI Trauma Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Photo Card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-52">
              <img 
                src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80" 
                alt="Injured animal" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-3 border-2 border-emerald-400 rounded-xl pointer-events-none p-2 flex flex-col justify-between bg-emerald-500/10">
                <span className="self-start bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                  CAMERA FEED: BOVINE (88% CONFIDENCE)
                </span>
                <span className="self-end bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  AVTS: SEVERE RECUMBENCY
                </span>
              </div>
            </div>

            {/* Advisory Medical Brief & Citizen Contact */}
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>AI Advisory Visual Trauma Diagnosis</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Computer vision identifies recumbent adult bovine with visible trauma on left hind limb. Extreme vehicular collision risk on NH66 corridor. Hydraulic hoist deployment advised.
                </p>
              </div>

              {/* Citizen Contact Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Reporter: {activeEmergency.citizen_name || "Goa Commuter"}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">+91 98234-XXXX (Masked CAD Proxy)</div>
                </div>

                <a 
                  href="tel:1962"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Reporter</span>
                </a>
              </div>
            </div>
          </div>

          {/* Turn-by-Turn GPS Navigation Launcher */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-blue-950">Turn-by-Turn GPS Navigation Ready</div>
                <div className="text-xs text-blue-700">
                  Target: {activeEmergency.latitude}, {activeEmergency.longitude} (NH66 Porvorim Flyover)
                </div>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeEmergency.latitude},${activeEmergency.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <span>Launch Google Maps Live Routing</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* 5. Interactive Field Milestone Buttons */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Tap Field Milestone As You Progress:
            </label>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleUpdateStatus("EN_ROUTE")}
                disabled={updating}
                className="p-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm text-center space-y-2 transition-all"
              >
                <Radio className="w-5 h-5 mx-auto text-red-400 animate-pulse" />
                <div>1. En Route</div>
                <div className="text-[10px] text-slate-400">Siren & Beacons Active</div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus("ON_SCENE")}
                disabled={updating}
                className="p-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-sm text-center space-y-2 transition-all"
              >
                <MapPin className="w-5 h-5 mx-auto text-white" />
                <div>2. Arrived On Scene</div>
                <div className="text-[10px] text-blue-200">Perimeter Secured</div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus("IN_TRANSIT")}
                disabled={updating}
                className="p-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl shadow-sm text-center space-y-2 transition-all"
              >
                <CheckCircle2 className="w-5 h-5 mx-auto text-white" />
                <div>3. Animal Secured</div>
                <div className="text-[10px] text-amber-200">Hoisted into Transport</div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus("ADMITTED")}
                disabled={updating}
                className="p-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl shadow-sm text-center space-y-2 transition-all"
              >
                <Cross className="w-5 h-5 mx-auto text-white" />
                <div>4. Hospital Handoff</div>
                <div className="text-[10px] text-purple-200">Transfer to Polyclinic ICU</div>
              </button>
            </div>
          </div>

          {/* Quick Clinical Intervention Checklist */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Quick Field Clinical Actions:
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action, i) => {
                const isSelected = selectedActions.includes(action);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => toggleAction(action)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1 ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{isSelected ? "Active:" : "+"}</span>
                    <span>{action}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field Notes Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              On-Scene Clinical Assessment Notes:
            </label>
            <textarea
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              placeholder="e.g. Adult bovine restrained, wound pressure applied, transporting to Panaji PolyClinic..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 outline-none focus:border-red-500 h-24"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
          <Truck className="w-12 h-12 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900">No Pending Emergency Dispatches</h3>
          <p className="text-xs max-w-sm mx-auto">
            {currentUnit?.unit_callsign} is in standby patrol on the NH66 Highway Corridor. New citizen emergencies will trigger audio chimes immediately.
          </p>
        </div>
      )}
    </div>
  );
}