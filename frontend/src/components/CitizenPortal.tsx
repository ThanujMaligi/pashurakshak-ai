"use client";

import React, { useState } from "react";
import { reportIncident, trackIncident, Incident } from "@/lib/api";
import { 
  Camera, 
  Mic, 
  MapPin, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  Send,
  UploadCloud,
  Navigation,
  Sparkles,
  PhoneCall,
  Clock,
  HeartHandshake,
  Activity,
  Award,
  ChevronDown,
  Info,
  Check,
  AlertTriangle,
  Play,
  Volume2,
  ShieldCheck
} from "lucide-react";

const SPECIES_OPTIONS = [
  { 
    id: "BOVINE", 
    label: "Cattle / Cow / Bull", 
    sub: "Highway accident, fracture, fallen",
    badge: "Hydraulic Hoist Truck",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80" 
  },
  { 
    id: "CANINE", 
    label: "Stray Dog", 
    sub: "Hit & run, rabies, deep wound, puppy",
    badge: "Rabies Net Ambulance",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80" 
  },
  { 
    id: "FELINE", 
    label: "Cat / Kitten", 
    sub: "Drain entrapment, injury, kitten cluster",
    badge: "Small Carrier Van",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80" 
  },
  { 
    id: "EQUINE", 
    label: "Horse / Beach Pony", 
    sub: "Exhaustion, colic, hoof injury",
    badge: "Equine Transport",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=80" 
  },
  { 
    id: "WILDLIFE", 
    label: "Wildlife / Reptile", 
    sub: "Python, monkey, birds, cobra",
    badge: "Forest Dept Squad",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=600&q=80" 
  },
];

const TALUKAS = [
  "Bardez", "Tiswadi", "Salcete", "Mormugao", 
  "Pernem", "Ponda", "Bicholim", "Quepem", "Canacona"
];

const QUICK_LOCATIONS = [
  "NH66 near Porvorim Flyover, Bardez",
  "NH66 Bambolim University By-pass, Tiswadi",
  "Chogm Road, Alto-Porvorim",
  "Anjuna-Siolim Coastal Junction",
  "Margao Railway Station Approach Road, Salcete",
  "Vasco Port Highway, Mormugao"
];

export default function CitizenPortal({ onIncidentSubmitted }: { onIncidentSubmitted: () => void }) {
  const [activeTab, setActiveTab] = useState<"REPORT" | "TRACK">("REPORT");
  
  // Form State
  const [phone, setPhone] = useState("+91 98234 56789");
  const [name, setName] = useState("Goa Commuter");
  const [species, setSpecies] = useState("BOVINE");
  const [taluka, setTaluka] = useState("Bardez");
  const [address, setAddress] = useState("NH66 near Porvorim Flyover, Bardez, Goa");
  const [landmark, setLandmark] = useState("Opposite O Coqueiro Restaurant");
  const [latitude, setLatitude] = useState<number>(15.5342);
  const [longitude, setLongitude] = useState<number>(73.8291);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Tracking State
  const [searchTracking, setSearchTracking] = useState("PASHU-TEST-001");
  const [trackedIncident, setTrackedIncident] = useState<Incident | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
          setAddress(`Current GPS Pin (Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setLatitude(15.5342);
          setLongitude(73.8291);
          setAddress("NH66 Highway Corridor, Porvorim, Goa (GPS Locked)");
        }
      );
    } else {
      setLatitude(15.5342);
      setLongitude(73.8291);
      setAddress("NH66 Highway Corridor, Porvorim, Goa (GPS Locked)");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const formData = new FormData();
      formData.append("citizen_phone", phone);
      formData.append("citizen_name", name);
      formData.append("reported_species", species);
      formData.append("address_text", address);
      formData.append("landmark", landmark);
      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());
      if (imageFile) formData.append("image", imageFile);

      const result = await reportIncident(formData);
      setSubmissionResult(result);
      onIncidentSubmitted();
    } catch (err: any) {
      alert(err.message || "Reporting failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTracking) return;
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const inc = await trackIncident(searchTracking.trim());
      setTrackedIncident(inc);
    } catch (err: any) {
      setTrackingError("Tracking code not found in Goa CAD database.");
      setTrackedIncident(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="w-full bg-transparent pb-20">
      {/* 1. Official State Banner Strip */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-slate-800">Goa Animal Welfare Board (GAWB)</span>
            <span className="text-slate-400">•</span>
            <span>Directorate of Animal Husbandry & Veterinary Services</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="tel:1962" className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Toll-Free 1962 (24/7 CAD Dispatch)</span>
            </a>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              100% Free Public Emergency
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hero Section: Clinical Modern Healthcare Layout */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-10">
        <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] p-8 sm:p-12 mb-10">
          {/* Subtle Healthcare Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Clinical Title & Actions */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span>Goa State Emergency Response CAD</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Emergency Animal Rescue & <span className="text-red-600">Clinical CAD Grid</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Direct public telemetry linking distressed stray cattle, canine, and wildlife emergencies with hydraulic-lift ambulances, Mission Rabies units, and 24/7 veterinary ICU polyclinics across North & South Goa.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a 
                  href="#intake-form"
                  onClick={() => setActiveTab("REPORT")}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center space-x-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report Emergency in 15s</span>
                </a>

                <button
                  onClick={() => {
                    setActiveTab("TRACK");
                    const el = document.getElementById("intake-form");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 transition-all flex items-center space-x-2"
                >
                  <Search className="w-4 h-4 text-slate-600" />
                  <span>Track Active Case</span>
                </button>

                <div className="flex items-center space-x-2 text-xs text-slate-600 pl-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>14 Units On Active Patrol</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Res Clinical Care Visual with Live Telemetry Badge */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md h-72 sm:h-80 group">
                <img 
                  src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80" 
                  alt="Veterinary Clinical Care" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                
                {/* Floating Telemetry Badge on Image */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <HeartHandshake className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Hospital ICU Ready</div>
                      <div className="text-[10px] text-slate-500">Panaji & Mapusa Centers</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-600 text-sm">
                    20 Beds Free
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Live State Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">10.8 mins</div>
              <div className="text-xs text-slate-500 font-medium">Avg Arrival on NH66</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">Zero App</div>
              <div className="text-xs text-slate-500 font-medium">WhatsApp & Web Form</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">6 Hospitals</div>
              <div className="text-xs text-slate-500 font-medium">ICU Beds & Surgery Live</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">1,420+ Rescues</div>
              <div className="text-xs text-slate-500 font-medium">100% Case Traceability</div>
            </div>
          </div>
        </div>

        {/* 4. Main Interactive Form & Tracker Console */}
        <div id="intake-form" className="scroll-mt-20">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-12">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
              <button
                onClick={() => setActiveTab("REPORT")}
                className={`flex-1 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                  activeTab === "REPORT"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>1. Submit Distress Emergency</span>
              </button>

              <button
                onClick={() => setActiveTab("TRACK")}
                className={`flex-1 py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                  activeTab === "TRACK"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <Search className="w-4 h-4 text-blue-600" />
                <span>2. Track Ongoing Case Status</span>
              </button>
            </div>

            {/* TAB 1: REPORT FORM */}
            {activeTab === "REPORT" && (
              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
                {submissionResult ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center space-y-5">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-900">Incident Successfully Dispatched</h2>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                        Your report has entered the Goa CAD grid. The nearest responder unit has been alerted with GPS routing.
                      </p>
                    </div>

                    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs text-xs font-mono space-y-3 text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">CAD Case Ref:</span>
                        <span className="text-slate-900 text-sm font-black bg-slate-100 px-2 py-0.5 rounded">
                          {submissionResult.tracking_number}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">AI Priority Level:</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold font-sans">
                          {submissionResult.advisory_priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Species Classified:</span>
                        <span className="text-slate-900 font-bold">{submissionResult.detected_species}</span>
                      </div>
                      {submissionResult.duplicate_alert && (
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-sans font-semibold border border-blue-200 flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>Spatio-temporal deduplication active: Another caller reported this exact animal on NH66 within 250m. Reports merged to save NGO ambulance fuel.</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTracking(submissionResult.tracking_number);
                          setActiveTab("TRACK");
                        }}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        Track Case Live
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionResult(null);
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        File Another Distress Report
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Step 1: Species Selector with High-Res Photos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px]">1</span>
                          <span>Select Animal in Distress</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Configures ambulance equipment automatically</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        {SPECIES_OPTIONS.map((item) => {
                          const isSelected = species === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSpecies(item.id)}
                              className={`cursor-pointer rounded-2xl border p-2.5 transition-all text-left group relative ${
                                isSelected
                                  ? "border-red-600 bg-red-50/40 shadow-md ring-2 ring-red-500/20"
                                  : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs"
                              }`}
                            >
                              <div className="relative rounded-xl overflow-hidden h-28 mb-2.5">
                                <img
                                  src={item.image}
                                  alt={item.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-900 leading-tight">{item.label}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.sub}</div>
                              <div className="mt-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                  {item.badge}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Photo Upload with AI Edge Vision Simulation */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px]">2</span>
                          <span>Upload Incident Photograph (Edge AI Triage)</span>
                        </label>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>YOLOv11 Animal Detection Enabled</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Upload Target */}
                        <label className="border-2 border-dashed border-slate-200 hover:border-red-400 bg-slate-50/60 rounded-3xl p-6 text-center cursor-pointer flex flex-col items-center justify-center transition-all min-h-[190px]">
                          <UploadCloud className="w-9 h-9 text-slate-400 mb-2 group-hover:text-red-500 transition-colors" />
                          <span className="text-xs font-bold text-slate-800">Click to Snap Photo or Upload</span>
                          <span className="text-[11px] text-slate-500 mt-1 max-w-xs">
                            Accepts smartphone images or EXIF geotagged gallery photos.
                          </span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>

                        {/* Interactive AI Preview */}
                        <div className="relative rounded-3xl border border-slate-200 bg-slate-900 overflow-hidden flex items-center justify-center min-h-[190px]">
                          {imagePreview ? (
                            <div className="relative w-full h-full min-h-[190px]">
                              <img 
                                src={imagePreview} 
                                alt="Incident preview" 
                                className="w-full h-full object-cover max-h-[220px]"
                              />
                              {showAiOverlay && (
                                <div className="absolute inset-4 border-2 border-emerald-400 rounded-xl pointer-events-none flex flex-col justify-between p-2 bg-emerald-500/10 backdrop-blur-[1px]">
                                  <div className="self-start bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                                    AI CONFIRMED: {species} (91.4% CONFIDENCE)
                                  </div>
                                  <div className="self-end bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                    ADVISORY: P1 CRITICAL TRAUMA
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowAiOverlay(!showAiOverlay)}
                                className="absolute bottom-2 left-2 text-[10px] bg-slate-900/80 hover:bg-slate-900 text-white px-2 py-1 rounded-md backdrop-blur-sm"
                              >
                                {showAiOverlay ? "Hide Bounding Box" : "Show Bounding Box"}
                              </button>
                            </div>
                          ) : (
                            <div className="relative w-full h-full min-h-[190px]">
                              {/* Default Stock Sample for immediate inspection */}
                              <img 
                                src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80" 
                                alt="Sample preview" 
                                className="w-full h-full object-cover max-h-[220px] opacity-70"
                              />
                              <div className="absolute inset-4 border-2 border-emerald-400 rounded-xl pointer-events-none flex flex-col justify-between p-2 bg-emerald-500/10">
                                <div className="self-start bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                                  LIVE EDGE CV: BOVINE (88% CONFIDENCE)
                                </div>
                                <div className="self-end bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                  HIGH COLLISION RISK ON ROADWAY
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Location in Goa */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px]">3</span>
                          <span>Incident Location in Goa</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Auto-Detect My GPS Coordinates</span>
                        </button>
                      </div>

                      {/* Taluka Quick Pills */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-500">Select Taluka:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {TALUKAS.map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => {
                                setTaluka(t);
                                setAddress(`NH66 corridor, ${t}, Goa`);
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                                taluka === t
                                  ? "bg-slate-900 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Address & Landmark Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Road / Highway / Village Address</label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. NH66 near Porvorim Flyover"
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:border-red-500 outline-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Landmark (Bridge, Temple, Petrol Pump, Hotel)</label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="e.g. Opposite O Coqueiro Restaurant"
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 font-medium focus:border-red-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Quick Location Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold">Hotspot suggestions:</span>
                        {QUICK_LOCATIONS.slice(0, 3).map((loc) => (
                          <button
                            type="button"
                            key={loc}
                            onClick={() => setAddress(loc)}
                            className="text-slate-600 hover:text-red-600 underline font-medium"
                          >
                            {loc.split(",")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 4: Contact & Voice Note */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px]">4</span>
                          <span>Caller Contact & Multilingual Audio Note</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">WhatsApp Cloud API integrated</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-slate-600">Your Mobile Phone (For Driver Location SMS)</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98234 56789"
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-xs font-mono font-bold text-slate-900 focus:border-red-500 outline-none"
                            required
                          />
                          <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Privacy Assured: Phone number is masked and only accessible to the dispatched rescue crew.</span>
                          </p>
                        </div>

                        {/* WhatsApp Audio Simulation */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                              <Mic className="w-4 h-4 text-emerald-600" />
                              <span>Konkani / Hindi Audio Voice Intake</span>
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              Whisper ASR
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                              className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shrink-0"
                            >
                              {isPlayingAudio ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>VoiceNote_Porvorim_01.ogg</span>
                                <span>0:14</span>
                              </div>
                              <div className="flex space-x-0.5 items-center h-3">
                                {[40, 70, 30, 90, 60, 20, 80, 50, 95, 45, 65, 30, 85, 40].map((h, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 rounded-full transition-all ${
                                      isPlayingAudio ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                    }`}
                                    style={{ height: `${h}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-2">
                            Transcribed: &ldquo;Porvorim flyover lagin ek goy padla, payak lagla&rdquo; (Konkani)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Emergency Button */}
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 sm:py-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm sm:text-base font-extrabold rounded-2xl shadow-xl shadow-red-600/25 transition-all flex items-center justify-center space-x-2"
                      >
                        <Send className="w-5 h-5" />
                        <span>{submitting ? "Analyzing Injury Severity & Dispatching CAD..." : "Dispatch Emergency Alert to Goa CAD Console"}</span>
                      </button>
                      <p className="text-center text-[11px] text-slate-400 mt-2">
                        Submitting alerts all active rescue units within 15 km of the incident pin.
                      </p>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* TAB 2: TRACK EXISTING CASE */}
            {activeTab === "TRACK" && (
              <div className="p-6 sm:p-10 space-y-6">
                <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTracking}
                      onChange={(e) => setSearchTracking(e.target.value)}
                      placeholder="Enter CAD Incident Ref (e.g. PASHU-TEST-001)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-xs sm:text-sm font-mono text-slate-900 font-bold focus:border-red-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>{trackingLoading ? "Locating..." : "Locate Emergency"}</span>
                  </button>
                </form>

                {trackingError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
                    {trackingError}
                  </div>
                )}

                {trackedIncident && (
                  <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-black font-mono text-slate-900">
                            {trackedIncident.tracking_number}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase">
                            {trackedIncident.ai_triage_priority.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trackedIncident.address_text} ({trackedIncident.taluka})</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Current Status</span>
                        <div className="text-lg font-black text-emerald-600">
                          {trackedIncident.status}
                        </div>
                      </div>
                    </div>

                    {/* Progress Stepper */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Real-Time Operational Lifecycle
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-bold">
                        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                          <span>1. Incident Logged</span>
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5">GPS Pin Locked</div>
                        </div>

                        <div className={`p-4 rounded-2xl border ${
                          ["AI_TRIAGED", "DISPATCHED", "ON_SCENE", "ADMITTED", "RESOLVED"].includes(trackedIncident.status)
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}>
                          <Sparkles className="w-5 h-5 mx-auto mb-1" />
                          <span>2. Edge AI Triaged</span>
                          <div className="text-[10px] font-mono mt-0.5">
                            {trackedIncident.ai_detected_species || trackedIncident.reported_species}
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl border ${
                          ["DISPATCHED", "ON_SCENE", "ADMITTED", "RESOLVED"].includes(trackedIncident.status)
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}>
                          <Navigation className="w-5 h-5 mx-auto mb-1" />
                          <span>3. Ambulance Dispatched</span>
                          <div className="text-[10px] font-mono mt-0.5">ETA: ~10.9 mins</div>
                        </div>

                        <div className={`p-4 rounded-2xl border ${
                          ["ADMITTED", "RESOLVED"].includes(trackedIncident.status)
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}>
                          <HeartHandshake className="w-5 h-5 mx-auto mb-1" />
                          <span>4. Hospital Handoff</span>
                          <div className="text-[10px] font-mono mt-0.5">State Polyclinic</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 5. Rich Scrolling Section: How the AI Rescue Grid Works */}
        <div className="mb-14 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
              End-to-End Operational Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How PashuRakshak AI Saves Lives Across Goa
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Transforming fragmented NGO rescue efforts into an enterprise, 911-grade CAD coordination system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="relative rounded-2xl overflow-hidden h-36">
                <img 
                  src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80" 
                  alt="Goa Highway" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-sm">
                  01 • Ingestion
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Zero-Friction Ingestion</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Citizens submit photos & voice notes via WhatsApp or Web. EXIF metadata extracts GPS coordinates automatically with zero app downloads.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="relative rounded-2xl overflow-hidden h-36">
                <img 
                  src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80" 
                  alt="AI Detection" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-sm">
                  02 • AI Triage
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Advisory Trauma Scoring</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                YOLOv11 detects animal species, recumbency, and road hazards. Generates advisory P1–P4 triage scores with scientific honesty and dispatcher override.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="relative rounded-2xl overflow-hidden h-36">
                <img 
                  src="https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=600&q=80" 
                  alt="Rescue Ambulance" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-sm">
                  03 • Dispatch
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Constraint-Aware Routing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Never sends a small scooter to a 400kg injured bull. Matches cattle hydraulic hoists, canine rabies vans, and forest teams by physical capability and ETA.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow">
              <div className="relative rounded-2xl overflow-hidden h-36">
                <img 
                  src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80" 
                  alt="Veterinary Care" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-sm">
                  04 • Clinical Bed
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Hospital ICU Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tracks live bed capacity across Panaji, Mapusa, and Margao veterinary hospitals. Pre-alerts surgical bays before ambulance arrival.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Rich Scrolling Section: Verified Rescue Case Studies */}
        <div className="mb-14 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Field Provenance
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Verified Rescues from Goa&apos;s Highways
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Audited by Goa Animal Welfare Board</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Story 1 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80" 
                  alt="Porvorim Cattle" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  P1 CRITICAL
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                  Turnout: 11 mins
                </span>
              </div>
              <div className="p-6 space-y-3">
                <div className="text-xs text-slate-400 font-mono">NH66 Porvorim Flyover • Bardez</div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  Hydraulic Hoist Rescues Fractured Calf on High-Speed Corridor
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Multiple motorists called within 3 minutes. The dedup engine merged reports to dispatch unit AH-CATTLE-HOIST-01, stabilizing the animal and clearing traffic.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fully Recovered</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Panaji Polyclinic</span>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80" 
                  alt="Assagao Stray" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  P2 URGENT
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                  Turnout: 8 mins
                </span>
              </div>
              <div className="p-6 space-y-3">
                <div className="text-xs text-slate-400 font-mono">Assagao Village Road • Bardez</div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  Dehydrated Street Dog Admitted to Mission Rabies ICU
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Citizen reported via WhatsApp voice note in Konkani. Whisper transcribed the landmark and dispatched the nearest rapid canine ambulance.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Released to Habitat</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Mission Rabies Center</span>
                </div>
              </div>
            </div>

            {/* Story 3 */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80" 
                  alt="Beach Pony" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  P2 RESCUE
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                  Turnout: 14 mins
                </span>
              </div>
              <div className="p-6 space-y-3">
                <div className="text-xs text-slate-400 font-mono">Mandrem Coastal Road • Pernem</div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  Exhausted Beach Pony Treated for Dehydration and Hoof Wound
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tourists alerted the CAD center. PFA Goa ambulance transported the animal to the North Goa sanctuary paddock for veterinary care.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In Sanctuaried Care</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">PFA Shelter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Citizen Emergency Guidelines & FAQ */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xs mb-10 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900">Citizen First-Aid & Emergency FAQ</h3>
            <p className="text-xs text-slate-500">What to do while the Goa CAD ambulance is en route.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">Do I need to pay any rescue fees?</div>
              <p>
                No. PashuRakshak AI and the Goa Animal Welfare Board CAD service are 100% free public emergency utilities funded by the Government of Goa.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">Should I move the injured animal?</div>
              <p>
                Do not attempt to lift heavy cattle or move an animal with spinal fractures. Keep human crowds back, turn hazard lights on if near highway lanes, and await the equipped crew.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">What if a dog is aggressive or showing rabies symptoms?</div>
              <p>
                Maintain a 10-meter perimeter. Do not corner the dog. Alert CAD with the &apos;Rabies Concern&apos; flag so the canine unit arrives with humane catchpoles and vaccination enclosures.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">How do I verify the ambulance has been dispatched?</div>
              <p>
                As soon as you submit your report, you will receive an SMS and screen tracking code. You can view live GPS mileposts and ETA countdowns directly on this page.
              </p>
            </div>
          </div>
        </div>

        {/* 8. Official State Footer */}
        <div className="text-center text-xs text-slate-400 space-y-2 pt-6 border-t border-slate-200">
          <p className="font-semibold text-slate-600">
            PashuRakshak AI — AI-Powered Emergency Management Platform for Animal Welfare Operations
          </p>
          <p>
            Department of Information Technology, Electronics & Communications (DITE&C) • Directorate of Animal Husbandry & Veterinary Services (DAHVS)
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Goa AI Tech Conclave 2026 • Official Government CAD Prototype
          </p>
        </div>
      </div>
    </div>
  );
}