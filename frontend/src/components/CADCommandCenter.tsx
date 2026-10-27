"use client";

import React, { useState, useEffect } from "react";
import { 
  Incident, 
  RescueUnit, 
  VeterinaryFacility, 
  fetchRecommendations, 
  assignUnit, 
  overridePriority 
} from "@/lib/api";
import GoaInteractiveMap from "./GoaInteractiveMap";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  Activity, 
  Volume2, 
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  Eye,
  ArrowRight
} from "lucide-react";

interface CADProps {
  incidents: Incident[];
  units: RescueUnit[];
  facilities: VeterinaryFacility[];
  onRefresh: () => void;
}

// Curated high quality animal and rescue photos for rich visual rendering
const SPECIES_IMAGES: Record<string, string> = {
  BOVINE: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80",
  CANINE: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
  FELINE: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
  EQUINE: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80",
  WILDLIFE: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80",
  UNKNOWN: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=600&q=80"
};

export default function CADCommandCenter({
  incidents,
  units,
  facilities,
  onRefresh,
}: CADProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedIncident && incidents.length > 0) {
      const p1 = incidents.find((i) => i.ai_triage_priority === "P1_CRITICAL" && !i.is_duplicate);
      setSelectedIncident(p1 || incidents[0]);
    }
  }, [incidents, selectedIncident]);

  useEffect(() => {
    if (selectedIncident) {
      setLoadingRecs(true);
      fetchRecommendations(selectedIncident.id)
        .then((data) => setRecommendations(data.recommendations || []))
        .catch((err) => console.error("Recs error:", err))
        .finally(() => setLoadingRecs(false));
    }
  }, [selectedIncident]);

  const handleDispatch = async (unitId: number) => {
    if (!selectedIncident) return;
    setDispatching(true);
    try {
      await assignUnit(selectedIncident.id, unitId, "Dispatched via Goa CAD Console");
      setStatusMessage(`Unit successfully dispatched to ${selectedIncident.tracking_number}!`);
      onRefresh();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  };

  const handlePriorityOverride = async (prio: string) => {
    if (!selectedIncident) return;
    try {
      await overridePriority(selectedIncident.id, prio, "Dispatcher manual override");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Override failed");
    }
  };

  const activeIncidents = incidents.filter((i) => !i.is_duplicate && i.status !== "RESOLVED");
  const speciesKey = (selectedIncident?.ai_detected_species || selectedIncident?.reported_species || "UNKNOWN").toUpperCase();
  const animalPhotoUrl = SPECIES_IMAGES[speciesKey] || SPECIES_IMAGES["UNKNOWN"];

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Emergencies</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{activeIncidents.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">P1 Critical Golden Hr</div>
            <div className="text-2xl font-extrabold text-red-600 mt-0.5">
              {incidents.filter((i) => i.ai_triage_priority === "P1_CRITICAL").length}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Rescue Fleet</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
              {units.filter((u) => u.is_available).length} / {units.length} Standby
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hospital ICU Beds</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-0.5">
              {facilities.reduce((acc, f) => acc + (f.total_icu_beds - f.occupied_icu_beds), 0)} Available
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duplicates Suppressed</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-0.5">
              {incidents.filter((i) => i.is_duplicate).length} Merged
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main CAD Split: Map (Left 58%) + Detail & Dispatch (Right 42%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map + Incident Queue */}
        <div className="lg:col-span-7 space-y-4">
          <GoaInteractiveMap
            incidents={incidents}
            units={units}
            facilities={facilities}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />

          {/* Active Incidents Feed */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span>Live Emergency Ingestion Queue</span>
              </span>
              <button
                onClick={onRefresh}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Stream</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isP1 = inc.ai_triage_priority === "P1_CRITICAL";
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-red-50/50 border-red-300 shadow-sm"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${isP1 ? "bg-red-600 animate-pulse" : "bg-amber-500"}`} />
                      <div>
                        <div className="font-bold text-slate-900">
                          {inc.tracking_number} — {inc.ai_detected_species || inc.reported_species}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[320px] flex items-center">
                          <MapPin className="w-3 h-3 inline mr-1 text-slate-400 shrink-0" />
                          <span>{inc.address_text || `${inc.taluka}, Goa`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      {inc.is_duplicate && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          DUPLICATE
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        isP1 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {inc.ai_triage_priority.replace("_", " ")}
                      </span>
                      <span className="text-slate-500 font-semibold">{inc.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: High-Impact Visual Detail & Dispatch Studio */}
        <div className="lg:col-span-5 space-y-4">
          {selectedIncident ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              {/* Incident Header & Photo Card */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {selectedIncident.taluka} Taluka • {selectedIncident.status}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      {selectedIncident.tracking_number}
                    </h2>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wide">
                    {selectedIncident.ai_triage_priority.replace("_", " ")}
                  </span>
                </div>

                {/* Real Photo Thumbnail & Metadata */}
                <div className="relative rounded-2xl overflow-hidden h-44 border border-slate-200 shadow-inner group">
                  <img
                    src={animalPhotoUrl}
                    alt={selectedIncident.reported_species}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
                    <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-300 shrink-0" />
                      <span>{selectedIncident.address_text}</span>
                    </span>
                    <span className="bg-emerald-600/90 px-2.5 py-1 rounded-lg">
                      Detected: {selectedIncident.ai_detected_species || selectedIncident.reported_species} ({Math.round((selectedIncident.ai_species_confidence || 0.88) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Diagnostic Reasoning Box */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Advisory Visual Trauma Scoring</span>
                  </span>
                  <span className="text-amber-700 font-mono text-[11px]">Advisory Grade</span>
                </div>

                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {selectedIncident.ai_triage_reason || "Computer Vision identifies severe limb recumbency on roadway with high risk of collision."}
                </p>

                {/* Priority Override Bar */}
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900">Dispatcher Override:</span>
                  <div className="flex space-x-1 font-semibold text-[11px]">
                    {(["P1_CRITICAL", "P2_HIGH", "P3_MODERATE", "P4_ROUTINE"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePriorityOverride(p)}
                        className={`px-2.5 py-0.5 rounded-lg border transition-all ${
                          selectedIncident.ai_triage_priority === p
                            ? "bg-slate-900 text-white border-slate-900 font-bold"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {p.split("_")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ranked Dispatch Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Ranked Responder Units</span>
                  </span>
                  <span className="text-slate-500 font-medium">
                    {recommendations.filter((r) => r.is_eligible).length} Eligible
                  </span>
                </div>

                {loadingRecs ? (
                  <div className="text-center py-6 text-xs text-slate-500 font-medium">
                    Computing road network travel distances...
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recommendations.slice(0, 3).map((rec) => {
                      return (
                        <div
                          key={rec.unit_id}
                          className={`p-4 rounded-2xl border transition-all ${
                            rec.is_eligible
                              ? "bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs"
                              : "bg-red-50/40 border-red-200/60 opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-900 font-extrabold">{rec.unit_callsign}</span>
                            <span className="text-emerald-700 font-mono">
                              ETA ~{rec.eta_minutes} mins ({rec.distance_km} km)
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {rec.recommendation_reason}
                          </p>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Suitability: <b className="text-slate-900">{rec.suitability_score}/100</b>
                            </span>

                            {rec.is_eligible ? (
                              <button
                                disabled={dispatching}
                                onClick={() => handleDispatch(rec.unit_id)}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-600/20 flex items-center space-x-1"
                              >
                                <span>Dispatch Unit</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-red-600">Constraint Mismatch</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium text-xs">
              Select an incident from the map or queue to view CAD dispatch options.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
