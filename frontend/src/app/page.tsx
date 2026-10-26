"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import CADCommandCenter from "@/components/CADCommandCenter";
import CitizenPortal from "@/components/CitizenPortal";
import FieldResponderPWA from "@/components/FieldResponderPWA";
import VeterinaryDashboard from "@/components/VeterinaryDashboard";
import AnalyticsView from "@/components/AnalyticsView";
import { fetchIncidents, fetchUnits, fetchFacilities, Incident, RescueUnit, VeterinaryFacility, WS_BASE } from "@/lib/api";
import { Radio, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("cad");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setCurrentTab(tab);
    }
  }, []);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<RescueUnit[]>([]);
  const [facilities, setFacilities] = useState<VeterinaryFacility[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [incData, unitData, facData] = await Promise.all([
        fetchIncidents(),
        fetchUnits(),
        fetchFacilities(),
      ]);
      setIncidents(incData);
      setUnits(unitData);
      setFacilities(facData);
    } catch (err) {
      console.error("Data load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // WebSocket CAD live events
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_BASE);
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          console.log("[CAD Event]", parsed.event);
          loadData();
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, [loadData]);

  const activeIncidents = incidents.filter((i) => !i.is_duplicate && i.status !== "RESOLVED");
  const criticalP1Count = incidents.filter((i) => i.ai_triage_priority === "P1_CRITICAL" && !i.is_duplicate).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        activeIncidentsCount={activeIncidents.length}
        criticalP1Count={criticalP1Count}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
            <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-semibold text-slate-500">
              Connecting to Goa Animal Emergency Operations Core...
            </div>
          </div>
        ) : (
          <>
            {currentTab === "cad" && (
              <CADCommandCenter
                incidents={incidents}
                units={units}
                facilities={facilities}
                onRefresh={loadData}
              />
            )}

            {currentTab === "citizen" && (
              <CitizenPortal
                onIncidentSubmitted={() => {
                  loadData();
                }}
              />
            )}

            {currentTab === "responder" && (
              <FieldResponderPWA
                units={units}
                incidents={incidents}
                onRefresh={loadData}
              />
            )}

            {currentTab === "vet" && (
              <VeterinaryDashboard
                facilities={facilities}
                incidents={incidents}
                onRefresh={loadData}
              />
            )}

            {currentTab === "analytics" && (
              <AnalyticsView />
            )}
          </>
        )}
      </main>

      {/* Clean White Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 font-medium">
        <div className="max-w-[1700px] mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800">PashuRakshak AI</span>
            <span>•</span>
            <span>Goa AI Tech Conclave 2026</span>
            <span>•</span>
            <span>Dept of IT, Electronics & Communications (DITE&C)</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>State CAD Gateway Active</span>
            </span>
            <span>Emergency Dial: 1962 / 112</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
