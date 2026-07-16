import { useEffect, useRef, useState, useMemo } from "react";
import type { FarmerListItem } from "../../types/farmer.types";
import { useFarmerProfile } from "../../hooks/useFarmers";

interface GisMapViewProps {
  farmers: FarmerListItem[];
  onSelectFarmer: (id: string) => void;
  onViewProfile: () => void;
}

// ─── Crop colour palette ─────────────────────────────────────────────────────
const CROP_COLORS: Record<string, { fill: string; border: string }> = {
  Rice:       { fill: "#22c55e", border: "#16a34a" },
  Corn:       { fill: "#eab308", border: "#ca8a04" },
  Banana:     { fill: "#f97316", border: "#ea580c" },
  Coconut:    { fill: "#8b5cf6", border: "#7c3aed" },
  Cassava:    { fill: "#ef4444", border: "#dc2626" },
  Cacao:      { fill: "#a16207", border: "#92400e" },
  Vegetables: { fill: "#06b6d4", border: "#0891b2" },
  Default:    { fill: "#6b7280", border: "#4b5563" },
};

function getCropColor(cropType: string) {
  for (const key of Object.keys(CROP_COLORS)) {
    if (cropType?.toLowerCase().includes(key.toLowerCase())) return CROP_COLORS[key];
  }
  return CROP_COLORS.Default;
}

// ─── Weather mock (Talacogon, Agusan del Sur) ─────────────────────────────────
const WEATHER_DAYS = [
  { day: "Mon", icon: "⛅", high: 32, low: 24, rain: "2 mm" },
  { day: "Tue", icon: "🌧", high: 30, low: 23, rain: "8 mm" },
  { day: "Wed", icon: "🌦", high: 31, low: 24, rain: "5 mm" },
  { day: "Thu", icon: "☀️", high: 33, low: 25, rain: "0 mm" },
  { day: "Fri", icon: "☀️", high: 34, low: 25, rain: "0 mm" },
  { day: "Sat", icon: "⛅", high: 32, low: 24, rain: "1 mm" },
  { day: "Sun", icon: "🌧", high: 29, low: 23, rain: "10 mm" },
];

// ─── Stable polygon offset generator around a lat/lng point ──────────────────
const polygonsCache: Record<string, number[][]> = {};
function makePolygonAround(id: string, lat: number, lng: number) {
  if (polygonsCache[id]) return polygonsCache[id];
  const size = 0.003 + (parseInt(id.slice(-4), 16) % 100) / 10000;
  const half = size / 2;
  const seed = (n: number) => 0.7 + ((parseInt(id.slice(-2), 16) + n * 37) % 60) / 100;
  const pts = [
    [lat + half * seed(1),        lng - half * 0.6 * seed(2)],
    [lat + half * 0.5 * seed(3),  lng + half * seed(4)],
    [lat - half * 0.3 * seed(5),  lng + half * 0.8 * seed(6)],
    [lat - half * seed(7),        lng + half * 0.2 * seed(8)],
    [lat - half * 0.6 * seed(9),  lng - half * 0.9 * seed(10)],
    [lat + half * 0.2 * seed(11), lng - half * seed(12)],
  ];
  polygonsCache[id] = pts;
  return pts;
}

// ─── Tiny SVG sparkline ───────────────────────────────────────────────────────
function Sparkline({ values, color = "#22c55e" }: { values: number[]; color?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 160; const h = 38;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={color} opacity={0.12} />
    </svg>
  );
}

// ─── Panel skeleton ───────────────────────────────────────────────────────────
function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-zinc-800" />
          <div className="h-2 w-1/2 rounded bg-zinc-800" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded-xl bg-zinc-800/60" />)}
    </div>
  );
}

// ─── Main GIS Map View Component ─────────────────────────────────────────────
export function GisMapView({ farmers, onSelectFarmer, onViewProfile }: GisMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const pinsRef = useRef<any[]>([]);

  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("All");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [healthFilter, setHealthFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "street">("satellite");
  const [showLegend, setShowLegend] = useState(true);

  const { data: selectedFarmer, isLoading: profileLoading } = useFarmerProfile(selectedId);

  // ── Filter derived data ─────────────────────────────────────────────────────
  const cropTypes = useMemo(
    () => ["All", ...Array.from(new Set(farmers.map((f) => f.cropType).filter(Boolean)))],
    [farmers]
  );
  const barangays = useMemo(
    () => ["All", ...Array.from(new Set(farmers.map((f) => f.barangay).filter(Boolean)))],
    [farmers]
  );

  const filteredFarmers = useMemo(
    () =>
      farmers.filter((f) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          f.fullName.toLowerCase().includes(q) ||
          f.rsbsaId.toLowerCase().includes(q) ||
          f.barangay.toLowerCase().includes(q);
        return matchSearch && (cropFilter === "All" || f.cropType === cropFilter) && (barangayFilter === "All" || f.barangay === barangayFilter);
      }),
    [farmers, search, cropFilter, barangayFilter]
  );

  const geoFarmers = useMemo(
    () => filteredFarmers.filter((f) => f.latitude && f.longitude),
    [filteredFarmers]
  );

  const cropCounts = useMemo(() => {
    const c: Record<string, number> = {};
    geoFarmers.forEach((f) => { c[f.cropType] = (c[f.cropType] || 0) + 1; });
    return c;
  }, [geoFarmers]);

  // Stable sparkline data per selected farmer
  const yieldData = useMemo(
    () => Array.from({ length: 10 }, (_, i) => 2.5 + Math.sin(i * 0.8 + (selectedId ? selectedId.charCodeAt(0) : 0)) * 0.9),
    [selectedId]
  );
  const tempData = useMemo(
    () => Array.from({ length: 10 }, (_, i) => 28 + Math.cos(i * 0.6 + (selectedId ? selectedId.charCodeAt(1) : 0)) * 2.5),
    [selectedId]
  );

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([8.1297, 125.3962], 12);
    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);

    const satTile = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });
    const strTile = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
    (map as any)._satTile = satTile;
    (map as any)._strTile = strTile;
    satTile.addTo(map);

    setTimeout(() => map.invalidateSize(), 250);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Tile layer switch ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sat = (map as any)._satTile;
    const str = (map as any)._strTile;
    if (!sat || !str) return;
    if (mapStyle === "satellite") { str.remove(); sat.addTo(map); }
    else { sat.remove(); str.addTo(map); }
  }, [mapStyle]);

  // ── Draw polygons & pins ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L = (window as any).L;
    if (!L) return;

    layersRef.current.forEach((l) => l.remove());
    pinsRef.current.forEach((p) => p.remove());
    layersRef.current = [];
    pinsRef.current = [];

    geoFarmers.forEach((farmer) => {
      if (!farmer.latitude || !farmer.longitude) return;
      const color = getCropColor(farmer.cropType);
      const isSel = farmer.id === selectedId;

      let poly: any = null;
      let center: [number, number] = [farmer.latitude, farmer.longitude];

      // Draw real polygon if we have a farm boundary
      if (farmer.farmBoundary && (farmer.farmBoundary as any).coordinates?.[0]) {
        try {
          const coords = (farmer.farmBoundary as any).coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
          poly = L.polygon(coords, {
            color: isSel ? "#ffffff" : color.border,
            weight: isSel ? 3 : 1.5,
            fillColor: color.fill,
            fillOpacity: isSel ? 0.55 : 0.32,
            dashArray: isSel ? undefined : "5 4",
          }).addTo(map);
          center = poly.getBounds().getCenter();
          poly.on("click", () => { setSelectedId(farmer.id); onSelectFarmer(farmer.id); });
          layersRef.current.push(poly);
        } catch (e) {
          console.error("Failed to render polygon for farmer", farmer.id, e);
        }
      }

      const labelIcon = L.divIcon({
        className: "",
        html: `<div style="background:rgba(0,0,0,0.72);border:1px solid ${color.border};border-radius:8px;padding:3px 7px;white-space:nowrap;">
          <p style="color:#fff;font-size:9px;font-weight:700;margin:0;">${farmer.fullName.split(" ")[0]} ${farmer.fullName.split(" ").slice(-1)[0]}</p>
          <p style="color:${color.fill};font-size:8px;font-weight:600;margin:0;">${farmer.cropType}${farmer.farmAreaHa ? ` (${Number(farmer.farmAreaHa).toFixed(1)} ha)` : ""}</p>
        </div>`,
        iconSize: [110, 36],
        iconAnchor: [55, 18],
      });
      const lbl = L.marker(center, { icon: labelIcon, interactive: false }).addTo(map);
      layersRef.current.push(lbl);

      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:13px;height:13px;border-radius:50%;background:${color.fill};border:2.5px solid #fff;box-shadow:0 0 0 3px ${color.fill}55,0 2px 6px rgba(0,0,0,.5);"></div>`,
        iconSize: [13, 13],
        iconAnchor: [6, 6],
      });
      const pin = L.marker([farmer.latitude, farmer.longitude], { icon: pinIcon }).addTo(map);
      pin.on("click", () => { setSelectedId(farmer.id); onSelectFarmer(farmer.id); });
      pinsRef.current.push(pin);
    });

    if (geoFarmers.length > 0 && !selectedId) {
      try {
        const grp = (window as any).L.featureGroup([...layersRef.current, ...pinsRef.current]);
        map.fitBounds(grp.getBounds().pad(0.15));
      } catch {}
    }
  }, [geoFarmers, selectedId]);

  // ── Fly to selected farmer ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const f = geoFarmers.find((x) => x.id === selectedId);
    if (f?.latitude && f?.longitude) map.flyTo([f.latitude, f.longitude], 15, { duration: 1 });
  }, [selectedId]);

  const latestRecord = selectedFarmer?.cropRecords?.[0] ?? null;
  const allocations = selectedFarmer?.inputAllocations ?? [];
  const hasCoords = selectedFarmer?.gisLocation?.latitude != null && selectedFarmer?.gisLocation?.longitude != null;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 96px)", minHeight: 600 }}>
      {/* ── TOP FILTER BAR ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-t-3xl border border-b-0 border-white/10 bg-zinc-900/90 backdrop-blur-xl px-4 py-3 z-20 flex-shrink-0">
        <div className="relative min-w-[180px] flex-1 max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer, farm, or barangay..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-8 pr-3 py-2 text-[11px] text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500 transition">
          {cropTypes.map((c) => <option key={c}>{c === "All" ? "All Crops" : c}</option>)}
        </select>

        <select value={barangayFilter} onChange={(e) => setBarangayFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500 transition">
          {barangays.map((b) => <option key={b}>{b === "All" ? "All Barangay" : b}</option>)}
        </select>

        <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[11px] text-white outline-none focus:border-emerald-500 transition">
          {["All Health Status", "Healthy", "At Risk", "Critical", "No Data"].map((h) => <option key={h}>{h}</option>)}
        </select>

        <div className="flex-1" />

        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
          {(["satellite", "street"] as const).map((s) => (
            <button key={s} onClick={() => setMapStyle(s)}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${mapStyle === s ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] font-bold text-zinc-300 hover:border-zinc-500 transition">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>

        <button onClick={onViewProfile} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-bold text-zinc-950 hover:bg-emerald-400 transition shadow-[0_4px_18px_-8px_rgba(16,185,129,0.7)]">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          + Add Farmer
        </button>
      </div>

      {/* ── MAIN BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 border border-white/10 rounded-b-3xl overflow-hidden">

        {/* ── LEFT: FARMER LIST ─────────────────────────────────────────────── */}
        <div className="w-[230px] flex-shrink-0 bg-zinc-900/90 border-r border-white/10 flex flex-col">
          <div className="px-4 pt-4 pb-2 border-b border-white/10 flex-shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">FARMERS</h3>
            <p className="text-[9px] text-zinc-600 mt-0.5">{filteredFarmers.length} records • {barangayFilter === "All" ? "All Barangays" : barangayFilter}</p>
          </div>

          <div className="flex-1 overflow-y-auto py-1.5">
            {filteredFarmers.length === 0 ? (
              <p className="px-4 py-8 text-[10px] text-zinc-600 text-center">No farmers match filters.</p>
            ) : (
              filteredFarmers.map((farmer) => {
                const isSel = farmer.id === selectedId;
                const color = getCropColor(farmer.cropType);
                const hasGeo = !!(farmer.latitude && farmer.longitude);
                return (
                  <button key={farmer.id} onClick={() => { setSelectedId(farmer.id); onSelectFarmer(farmer.id); }}
                    className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${isSel ? "bg-white/10" : "hover:bg-white/5"}`}>
                    {isSel && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400 rounded-r" />}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{ background: `${color.fill}28`, border: `1.5px solid ${color.fill}55` }}>
                      {farmer.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-white leading-tight truncate">{farmer.fullName}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{farmer.barangay} • {farmer.cropType}</p>
                      <span className={`inline-flex mt-0.5 rounded-full px-1.5 py-px text-[8px] font-bold ${hasGeo ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                        {hasGeo ? "Mapped" : "No GIS"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 flex-shrink-0">
            <button className="rounded-lg bg-zinc-800 px-2 py-1 text-[9px] text-zinc-400 hover:text-white transition">← Prev</button>
            <span className="text-[9px] text-zinc-600">{Math.min(filteredFarmers.length, 10)} / {filteredFarmers.length}</span>
            <button className="rounded-lg bg-zinc-800 px-2 py-1 text-[9px] text-zinc-400 hover:text-white transition">Next →</button>
          </div>
        </div>

        {/* ── CENTER: MAP ───────────────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Stats pill */}
          <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 shadow-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white">{geoFarmers.length} Plots Geotagged</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 shadow-xl">
              <span className="text-[10px] text-zinc-300">{filteredFarmers.length} Total Farmers</span>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="absolute bottom-4 left-4 z-[500] rounded-2xl border border-white/15 bg-zinc-950/92 backdrop-blur-md p-3 space-y-2.5 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Legend</p>
                <button onClick={() => setShowLegend(false)} className="ml-4 text-[9px] text-zinc-600 hover:text-white transition">✕</button>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Crop Type</p>
                {Object.entries(cropCounts).slice(0, 7).map(([crop, count]) => {
                  const c = getCropColor(crop);
                  return (
                    <div key={crop} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: c.fill, border: `1.5px solid ${c.border}` }} />
                      <span className="text-[9px] text-zinc-300 flex-1">{crop}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/10 pt-2 space-y-1">
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Health Status</p>
                {[{ color: "#22c55e", label: "Healthy" }, { color: "#eab308", label: "At Risk" }, { color: "#ef4444", label: "Critical" }, { color: "#6b7280", label: "No Data" }].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[9px] text-zinc-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!showLegend && (
            <button onClick={() => setShowLegend(true)} className="absolute bottom-4 left-4 z-[500] rounded-xl border border-white/15 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-bold text-zinc-300 hover:text-white transition">
              Show Legend
            </button>
          )}

          {/* Weather forecast strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] w-[88%] max-w-[580px]">
            <div className="rounded-2xl border border-white/15 bg-zinc-950/92 backdrop-blur-md px-4 py-3 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Weather Forecast (7 Days)</p>
                  <p className="text-[8px] text-zinc-500">Talacogon, Agusan del Sur</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white">28.5°C <span className="font-normal text-zinc-500">feels 32°C</span></p>
                  <p className="text-[8px] text-zinc-500">Humidity 82% • Wind 12 km/h</p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {WEATHER_DAYS.map((d, i) => (
                  <div key={i} className={`flex flex-col items-center rounded-xl p-1.5 ${i === 0 ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/5"}`}>
                    <p className="text-[8px] font-bold text-zinc-400">{d.day}</p>
                    <p className="text-base leading-none my-1">{d.icon}</p>
                    <p className="text-[9px] font-bold text-white">{d.high}°</p>
                    <p className="text-[8px] text-zinc-500">{d.low}°</p>
                    <p className="text-[7px] text-sky-400 mt-0.5">{d.rain}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: SELECTED FARM PANEL ────────────────────────────────────── */}
        <div className="w-[265px] flex-shrink-0 bg-zinc-900/90 border-l border-white/10 flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                  <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold text-white">Select a Farm</p>
                <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">Click a marker or parcel on the map to view farm details.</p>
              </div>
            </div>
          ) : profileLoading ? (
            <PanelSkeleton />
          ) : selectedFarmer ? (
            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Profile header */}
              <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">SELECTED FARM</p>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ background: `${getCropColor(selectedFarmer.cropType).fill}25`, border: `2px solid ${getCropColor(selectedFarmer.cropType).fill}50` }}>
                    {selectedFarmer.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-white leading-tight">{selectedFarmer.fullName}</p>
                    <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{selectedFarmer.rsbsaId}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{selectedFarmer.barangay}</p>
                    <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[8px] font-bold ${hasCoords ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {hasCoords ? "GIS Mapped" : "Not Mapped"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {/* Farm Information */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-2">FARM INFORMATION</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {[
                      { label: "RSBSA No.", value: selectedFarmer.rsbsaId },
                      { label: "Area Ha.", value: selectedFarmer.farmAreaHa ? `${Number(selectedFarmer.farmAreaHa).toFixed(2)} ha (GIS)` : latestRecord ? `${latestRecord.areaHa} ha` : "— ha" },
                      { 
                        label: "GIS Coords", 
                        value: selectedFarmer.farmBoundary 
                          ? `${selectedFarmer.gisLocation.latitude?.toFixed(4)}, ${selectedFarmer.gisLocation.longitude?.toFixed(4)} (${(selectedFarmer.farmBoundary as any).coordinates[0].length - 1} pts)`
                          : hasCoords 
                            ? `${selectedFarmer.gisLocation.latitude?.toFixed(4)}, ${selectedFarmer.gisLocation.longitude?.toFixed(4)}` 
                            : "Not Set" 
                      },
                      { label: "Irrigation", value: "Drip Irrigation" },
                      { label: "Ownership", value: "Owner" },
                      { label: "Date Reg.", value: latestRecord?.createdAt ? new Date(latestRecord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[8px] text-zinc-600 uppercase tracking-wider">{label}</p>
                        <p className="text-[10px] font-bold text-white mt-0.5 leading-tight">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crop Information */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-400 mb-2">CROP INFORMATION</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base" style={{ background: `${getCropColor(selectedFarmer.cropType).fill}20` }}>🌾</div>
                    <div>
                      <p className="text-[11px] font-black text-white">{selectedFarmer.cropType}</p>
                      <p className="text-[9px] text-zinc-400">{selectedFarmer.season || "Wet Season"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Planting", value: latestRecord?.plantingDate ? new Date(latestRecord.plantingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—" },
                      { label: "Harvest", value: latestRecord?.harvestDate ? new Date(latestRecord.harvestDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—" },
                      { label: "Growth Stage", value: latestRecord?.status || "Planted" },
                      { label: "Est. Yield", value: `${yieldData[yieldData.length - 1].toFixed(1)} t/ha` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[8px] text-zinc-600 uppercase tracking-wider">{label}</p>
                        <p className="text-[10px] font-bold text-white mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field Status */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-2">FIELD STATUS</p>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                      { label: "Risk Level", value: "High Risk", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                      { label: "Soil Moist.", value: "18.8%", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                      { label: "NDVI", value: "0.42", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`rounded-lg border p-2 text-center ${bg}`}>
                        <p className="text-[7px] text-zinc-500 uppercase leading-tight">{label}</p>
                        <p className={`text-[10px] font-black mt-0.5 ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-[9px]">
                    <span className="text-zinc-400">Temp <span className="font-bold text-white">28.5°C</span></span>
                    <span className="text-zinc-400">Humidity <span className="font-bold text-white">82%</span></span>
                    <span className="text-sky-400 font-bold">Jun 30, 2026</span>
                  </div>
                </div>

                {/* Yield Analytics */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">YIELD ANALYTICS</p>
                    <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[8px] text-zinc-400 outline-none">
                      <option>30 Days</option><option>90 Days</option><option>1 Year</option>
                    </select>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-3 space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-[9px] text-zinc-400">Crop Growth Progress</p>
                        <span className="text-[9px] font-bold text-emerald-400">62%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: "62%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-[9px] text-zinc-400">Est. Yield Trend (t/ha)</p>
                        <span className="text-[9px] font-bold text-amber-400">{yieldData[yieldData.length - 1].toFixed(1)}</span>
                      </div>
                      <Sparkline values={yieldData} color="#22c55e" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-[9px] text-zinc-400">Temperature (°C)</p>
                        <span className="text-[9px] font-bold text-sky-400">{tempData[tempData.length - 1].toFixed(1)}°C</span>
                      </div>
                      <Sparkline values={tempData} color="#38bdf8" />
                    </div>
                  </div>
                </div>

                {/* Input Allocations */}
                {allocations.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-2">INPUT ALLOCATIONS</p>
                    <div className="space-y-1.5">
                      {allocations.slice(0, 3).map((a, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2">
                          <div>
                            <p className="text-[9px] font-bold text-white">{a.fertilizer ? `Fertilizer: ${a.fertilizer}` : a.seeds ? `Seeds: ${a.seeds}` : "Allocation"}</p>
                            <p className="text-[8px] text-zinc-500">{a.allocatedAt ? new Date(a.allocatedAt).toLocaleDateString() : "—"}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${a.status === "Received" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button onClick={onViewProfile}
                  className="w-full rounded-xl bg-emerald-500 py-2.5 text-[11px] font-black uppercase tracking-wider text-zinc-950 hover:bg-emerald-400 transition shadow-[0_6px_18px_-8px_rgba(16,185,129,0.7)]">
                  View Full Profile →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4">
              <p className="text-[10px] text-zinc-500">Could not load profile data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
