import { useEffect, useRef, useState } from "react";
import area from "@turf/area";
import { polygon as turfPolygon } from "@turf/helpers";
import type { PolygonCoord } from "../../types/farmer.types";

interface PolygonMapSelectorProps {
  polygonCoords: PolygonCoord[];
  onChange: (coords: PolygonCoord[], areaHa: number) => void;
  existingPolygon?: {
    type: "Polygon";
    coordinates: number[][][];
  } | null;
}

export function PolygonMapSelector({
  polygonCoords,
  onChange,
  existingPolygon,
}: PolygonMapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);

  const [activeArea, setActiveArea] = useState<number>(0);

  // Initialize polygon coords from existing polygon if present and empty
  useEffect(() => {
    if (existingPolygon && existingPolygon.coordinates && existingPolygon.coordinates[0] && polygonCoords.length === 0) {
      // GeoJSON has coordinates as [lng, lat], we need {lat, lng}
      // Note: GeoJSON polygons have closed loops, so we drop the last point if it matches the first
      const geoPts = existingPolygon.coordinates[0];
      const pts: PolygonCoord[] = [];
      for (let i = 0; i < geoPts.length; i++) {
        if (i === geoPts.length - 1 && i > 0) {
          const first = geoPts[0];
          const last = geoPts[i];
          if (first[0] === last[0] && first[1] === last[1]) {
            break;
          }
        }
        pts.push({ lat: geoPts[i][1], lng: geoPts[i][0] });
      }
      if (pts.length > 0) {
        const areaHa = calculateArea(pts);
        onChange(pts, areaHa);
      }
    }
  }, [existingPolygon]);

  // Recalculate area whenever coordinates change
  useEffect(() => {
    const areaHa = calculateArea(polygonCoords);
    setActiveArea(areaHa);
  }, [polygonCoords]);

  // Helper to calculate area in Hectares
  function calculateArea(coords: PolygonCoord[]): number {
    if (coords.length < 3) return 0;
    try {
      const pts = coords.map((c) => [c.lng, c.lat]);
      // Close the polygon loop for Turf
      const first = pts[0];
      const last = pts[pts.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        pts.push([first[0], first[1]]);
      }
      const poly = turfPolygon([pts]);
      const areaSqM = area(poly);
      return areaSqM / 10000; // 1 Hectare = 10,000 sq meters
    } catch (e) {
      console.error("Failed to calculate turf area", e);
      return 0;
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet is not loaded.");
      return;
    }

    // Default center: Talacogon, Agusan del Sur
    let centerLat = 8.1297;
    let centerLng = 125.3962;

    if (polygonCoords.length > 0) {
      centerLat = polygonCoords[0].lat;
      centerLng = polygonCoords[0].lng;
    } else if (existingPolygon && existingPolygon.coordinates?.[0]?.[0]) {
      centerLng = existingPolygon.coordinates[0][0][0];
      centerLat = existingPolygon.coordinates[0][0][1];
    }

    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 14);
    mapInstanceRef.current = map;

    // Add high quality satellite layer by default, and fallback to OSM
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
      }
    ).addTo(map);

    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    L.control.layers({ Satellite: satellite, Streets: streets }, {}, { position: "topright" }).addTo(map);

    // Group for dragging markers
    const markersGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Polygon preview layer
    const polygonLayer = L.polygon([], {
      color: "#10b981", // Emerald
      weight: 3,
      fillColor: "#10b981",
      fillOpacity: 0.2,
    }).addTo(map);
    polygonLayerRef.current = polygonLayer;

    // Click map to drop a point directly (very intuitive)
    map.on("click", (e: any) => {
      // Prevent adding if standard draw tools are actively running
      if (mapInstanceRef.current._activeDrawTool) return;

      const newPoint: PolygonCoord = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      // Update coordinates
      const updated = [...polygonCoords, newPoint];
      const areaHa = calculateArea(updated);
      onChange(updated, areaHa);
    });

    // Setup Leaflet.Draw controls
    if (L.Control.Draw) {
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
          remove: false,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: "#ef4444",
              message: "<strong>Oh no!</strong> You cannot intersect lines!",
            },
            shapeOptions: {
              color: "#10b981",
            },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Listen for Leaflet Draw events
      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        if (event.layerType === "polygon") {
          const latlngs = layer.getLatLngs()[0];
          const newCoords = latlngs.map((ll: any) => ({
            lat: ll.lat,
            lng: ll.lng,
          }));
          const areaHa = calculateArea(newCoords);
          onChange(newCoords, areaHa);
        }
      });

      // Track active drawing status to prevent double clicks
      map.on(L.Draw.Event.DRAWSTART, () => {
        mapInstanceRef.current._activeDrawTool = true;
      });
      map.on(L.Draw.Event.DRAWSTOP, () => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current._activeDrawTool = false;
          }
        }, 100);
      });
    }

    setTimeout(() => {
      map.invalidateSize();
      if (polygonCoords.length > 0) {
        const bounds = L.latLngBounds(polygonCoords.map((c) => [c.lat, c.lng]));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update polygon and markers on coords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // 1. Update polygon coords
    const latLngArray = polygonCoords.map((c) => [c.lat, c.lng]);
    if (polygonLayerRef.current) {
      polygonLayerRef.current.setLatLngs(latLngArray);
    }

    // 2. Clear and recreate draggable markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      polygonCoords.forEach((coord, idx) => {
        // Create custom div icon that looks like a small numbered green dot
        const dotIcon = L.divIcon({
          className: "",
          html: `<div style="
            width: 22px; 
            height: 22px; 
            background: #10b981; 
            border: 2px solid white; 
            border-radius: 50%; 
            color: black; 
            font-size: 10px; 
            font-weight: 800; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ">${idx + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([coord.lat, coord.lng], {
          draggable: true,
          icon: dotIcon,
        }).addTo(markersGroupRef.current);

        // Marker drag handler
        marker.on("drag", (e: any) => {
          const newLatLng = e.target.getLatLng();
          const newCoords = [...polygonCoords];
          newCoords[idx] = { lat: newLatLng.lat, lng: newLatLng.lng };
          
          // Live update polygon shape while dragging
          if (polygonLayerRef.current) {
            polygonLayerRef.current.setLatLngs(newCoords.map((c) => [c.lat, c.lng]));
          }
        });

        marker.on("dragend", (e: any) => {
          const newLatLng = e.target.getLatLng();
          const newCoords = [...polygonCoords];
          newCoords[idx] = { lat: newLatLng.lat, lng: newLatLng.lng };
          
          const areaHa = calculateArea(newCoords);
          onChange(newCoords, areaHa);
        });
      });
    }
  }, [polygonCoords]);

  // Handle manual input field updates
  function handleCoordItemChange(idx: number, key: "lat" | "lng", val: string) {
    const numVal = Number(val);
    const updated = [...polygonCoords];
    updated[idx] = {
      ...updated[idx],
      [key]: isNaN(numVal) ? updated[idx][key] : numVal,
    };
    const areaHa = calculateArea(updated);
    onChange(updated, areaHa);
  }

  // Remove point from polygon
  function handleRemovePoint(idx: number) {
    const updated = polygonCoords.filter((_, i) => i !== idx);
    const areaHa = calculateArea(updated);
    onChange(updated, areaHa);
  }

  // Clear all coordinates
  function handleClearAll() {
    onChange([], 0);
  }

  // Undo last added coordinate
  function handleUndo() {
    if (polygonCoords.length === 0) return;
    const updated = polygonCoords.slice(0, -1);
    const areaHa = calculateArea(updated);
    onChange(updated, areaHa);
  }

  return (
    <div className="space-y-4">
      {/* Visual Header Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3 flex flex-col justify-center">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Farm Boundary Area</label>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {activeArea.toFixed(4)}
            </span>
            <span className="text-xs font-bold text-zinc-400">hectares (ha)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3 flex flex-col justify-center">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status / Validation</label>
          <div className="flex items-center gap-2 mt-1.5">
            {polygonCoords.length < 3 ? (
              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Min 3 points required (Currently: {polygonCoords.length})
              </span>
            ) : polygonCoords.length > 50 ? (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Warning: Limit exceeded (Max 50, currently: {polygonCoords.length})
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Valid Boundary ({polygonCoords.length} points)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Map View */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[320px] w-full rounded-2xl border border-white/10 shadow-inner z-10 overflow-hidden"
          style={{ background: "#111" }}
        />
        <div className="absolute top-3 left-3 z-[500] pointer-events-none">
          <div className="rounded-lg border border-white/15 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 text-[10px] text-white font-semibold">
            🖱️ Click map to add coordinates or drag numbers to adjust
          </div>
        </div>
      </div>

      {/* Toolbar actions */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Boundary Point Editor</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={polygonCoords.length === 0}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-zinc-300 transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
          >
            Undo Last Point
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={polygonCoords.length === 0}
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-[10px] font-bold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-40 disabled:hover:bg-rose-500/5"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Coordinate list scrollarea */}
      <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {polygonCoords.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-white/5 rounded-xl">
            No coordinates placed yet. Click on the map to begin mapping the farm boundary.
          </div>
        ) : (
          polygonCoords.map((coord, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-2 text-xs"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/25 border border-emerald-500/30 text-[9px] font-black text-emerald-300">
                {idx + 1}
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Lat:</span>
                  <input
                    type="number"
                    step="any"
                    value={coord.lat}
                    onChange={(e) => handleCoordItemChange(idx, "lat", e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-zinc-800 focus:border-emerald-500 py-0.5 text-white outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Lng:</span>
                  <input
                    type="number"
                    step="any"
                    value={coord.lng}
                    onChange={(e) => handleCoordItemChange(idx, "lng", e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-zinc-800 focus:border-emerald-500 py-0.5 text-white outline-none font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePoint(idx)}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                title="Remove Coordinate Point"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
