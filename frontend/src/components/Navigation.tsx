"use client";

import React from "react";
import { 
  ShieldAlert, 
  MapPin, 
  Truck, 
  Cross, 
  BarChart3, 
  Radio, 
  PhoneCall,
  Activity
} from "lucide-react";

interface NavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeIncidentsCount: number;
  criticalP1Count: number;
}

export default function Navigation({ 
  currentTab, 
  onSelectTab, 
  activeIncidentsCount,
  criticalP1Count 
}: NavProps) {
  const tabs = [
    {
      id: "cad",
      label: "Command CAD",
      sublabel: "Live Dispatch",
      icon: ShieldAlert,
      badge: criticalP1Count > 0 ? `${criticalP1Count} CRITICAL` : `${activeIncidentsCount} ACTIVE`,
      badgeColor: criticalP1Count > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      id: "citizen",
      label: "Citizen Report",
      sublabel: "Public Intake",
      icon: MapPin,
      badge: "No App Needed",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      id: "responder",
      label: "Rescue Units",
      sublabel: "Ambulance PWA",
      icon: Truck,
      badge: "GPS Routing",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      id: "vet",
      label: "Veterinary Care",
      sublabel: "ICU Beds",
      icon: Cross,
      badge: "Live Bays",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      id: "analytics",
      label: "GIS Analytics",
      sublabel: "Goa Heatmaps",
      icon: BarChart3,
      badge: "DITE&C",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
    }
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Identity */}
        <div 
          className="flex items-center space-x-3.5 cursor-pointer group" 
          onClick={() => onSelectTab("cad")}
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-500 text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-lg text-slate-900">
                PashuRakshak <span className="text-red-600">AI</span>
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                Goa State CAD
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Enterprise Emergency Operations & Multimodal Animal Welfare
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <nav className="flex items-center space-x-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-600" : "text-slate-500"}`} />
                <span className="hidden md:inline">{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Emergency Hotline & Telemetry */}
        <div className="flex items-center space-x-3">
          <div className="hidden xl:flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FastAPI Core: Connected</span>
          </div>

          <a 
            href="tel:1962"
            className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-600/20"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Dial 1962 (Toll Free)</span>
          </a>
        </div>
      </div>
    </header>
  );
}
