"use client";

import React, { useState } from "react";
import { Incident, RescueUnit, VeterinaryFacility } from "@/lib/api";
import { Compass, Layers, ShieldAlert, Truck, Cross, MapPin } from "lucide-react";

interface MapProps {
  incidents: Incident[];
  units: RescueUnit[];
  facilities: VeterinaryFacility[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

const MIN_LAT = 14.85;
const MAX_LAT = 15.82;
const MIN_LON = 73.65;
const MAX_LON = 74.38;

export default function GoaInteractiveMap({
  incidents,
  units,
  facilities,
  selectedIncident,
  onSelectIncident,
}: MapProps) {
  const [filterLayer, setFilterLayer] = useState<"ALL" | "P1" | "UNITS" | "CLINICS">("ALL");

  const project = (lat: number, lon: number) => {
    const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * 800;
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 900;
    return { x: Math.max(20, Math.min(780, x)), y: Math.max(20, Math.min(880, y)) };
  };

  return (
    <div className="relative w-full h-[620px] bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* Top Map Filter Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium shadow-sm">
          <Compass className="w-4 h-4 text-red-600 animate-spin-slow" />
          <span className="font-bold text-slate-900">Goa CAD Geospatial Radar</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600 font-semibold">NH66 High-Incident Corridor</span>
        </div>

        {/* Filter Pills */}
        <div className="pointer-events-auto flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
          {(["ALL", "P1", "UNITS", "CLINICS"] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setFilterLayer(layer)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all ${
                filterLayer === layer
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {layer === "P1" ? "P1 Critical" : layer}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <svg
          viewBox="0 0 800 900"
          className="w-full h-full object-cover select-none"
          style={{ background: "#F8FAFC" }}
        >
          {/* Subtle Grid */}
          <defs>
            <pattern id="light-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#light-grid)" />

          {/* Stylized Goa State Territory Outline */}
          <path
            d="M 120,40 Q 240,110 320,180 T 360,340 T 420,520 T 490,750 T 430,860 L 620,840 L 720,620 L 710,380 L 590,140 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="2"
            className="filter drop-shadow-sm"
          />

          {/* NH66 Highway Artery Route */}
          <path
            d="M 280,60 Q 320,200 340,320 T 370,440 T 420,660 T 430,840"
            fill="none"
            stroke="#DC2626"
            strokeWidth="3.5"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />
          <text x="330" y="270" fill="#DC2626" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
            NH66 HIGHWAY
          </text>

          {/* Taluka Centroid Labels */}
          <g fill="#64748B" fontSize="11" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">
            <text x="310" y="220">BARDEZ (Mapusa)</text>
            <text x="345" y="360">TISWADI (Panaji)</text>
            <text x="420" y="450">PONDA</text>
            <text x="300" y="470">MORMUGAO (Vasco)</text>
            <text x="430" y="600">SALCETE (Margao)</text>
            <text x="460" y="780">CANACONA</text>
            <text x="560" y="260">BICHOLIM</text>
            <text x="640" y="340">SATTARI</text>
          </g>

          {/* 1. Veterinary Facilities Pins */}
          {(filterLayer === "ALL" || filterLayer === "CLINICS") &&
            facilities.map((fac) => {
              const pos = project(fac.latitude, fac.longitude);
              const freeBeds = fac.total_icu_beds - fac.occupied_icu_beds;
              return (
                <g key={`fac-${fac.id}`} className="group cursor-pointer">
                  <circle cx={pos.x} cy={pos.y} r="16" fill="#8B5CF6" fillOpacity="0.15" />
                  <circle cx={pos.x} cy={pos.y} r="8" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                  
                  {/* Tooltip Card */}
                  <rect
                    x={pos.x - 70}
                    y={pos.y - 32}
                    width="140"
                    height="20"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    className="filter drop-shadow-xs"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 18}
                    fill="#6D28D9"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {fac.name.split(",")[0]} ({freeBeds} Free)
                  </text>
                </g>
              );
            })}

          {/* 2. Live Rescue Units Pins */}
          {(filterLayer === "ALL" || filterLayer === "UNITS") &&
            units.map((unit) => {
              const pos = project(unit.current_latitude, unit.current_longitude);
              return (
                <g key={`unit-${unit.id}`} className="group cursor-pointer">
                  <circle cx={pos.x} cy={pos.y} r="18" fill="#10B981" fillOpacity="0.2" />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="8"
                    fill={unit.is_available ? "#059669" : "#D97706"}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 18}
                    fill="#065F46"
                    fontSize="9"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {unit.unit_callsign}
                  </text>
                </g>
              );
            })}

          {/* 3. Emergency Incidents Pins (P1 - P4) */}
          {(filterLayer === "ALL" || filterLayer === "P1") &&
            incidents
              .filter((inc) => (filterLayer === "P1" ? inc.ai_triage_priority === "P1_CRITICAL" : true))
              .map((inc) => {
                const pos = project(inc.latitude, inc.longitude);
                const isSelected = selectedIncident?.id === inc.id;
                const isP1 = inc.ai_triage_priority === "P1_CRITICAL";
                const isP2 = inc.ai_triage_priority === "P2_HIGH";

                const pinColor = isP1 ? "#DC2626" : isP2 ? "#EA580C" : "#CA8A04";

                return (
                  <g
                    key={`inc-${inc.id}`}
                    onClick={() => onSelectIncident(inc)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {isP1 && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? "28" : "22"}
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2"
                        className="animate-ping"
                        style={{ transformOrigin: `${pos.x}px ${pos.y}px`, animationDuration: "2s" }}
                      />
                    )}

                    {isSelected && (
                      <circle cx={pos.x} cy={pos.y} r="18" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeDasharray="3 3" />
                    )}

                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? "10" : "8"}
                      fill={pinColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="filter drop-shadow-sm"
                    />

                    <text
                      x={pos.x}
                      y={pos.y - 12}
                      fill={pinColor}
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {inc.tracking_number} [{inc.ai_detected_species || inc.reported_species}]
                    </text>
                  </g>
                );
              })}
        </svg>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-red-700 font-bold">P1 Critical Urgent</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-amber-700 font-bold">P2 Urgent</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-emerald-800 font-semibold">Active Unit</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span className="text-purple-800 font-semibold">Veterinary Hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
