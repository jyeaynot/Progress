import { useEffect, useRef } from "react";
import type { FarmerListItem } from "../../types/farmer.types";

interface GisMapViewProps {
  farmers: FarmerListItem[];
  onSelectFarmer: (id: string) => void;
  onViewProfile: () => void;
}

export function GisMapView({ farmers, onSelectFarmer, onViewProfile }: GisMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet library not loaded.");
      return;
    }

    const mappedFarmers = farmers.filter(
      (f) => f.latitude !== null && f.latitude !== undefined
    );

    // Center to Talacogon, Agusan del Sur
    const centerLat = 8.1297;
    const centerLng = 125.3962;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([centerLat, centerLng], 12);

    // Set map tiles
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    // Apply the dark tiles style
    tiles.getContainer()?.classList.add("dark-map-tiles");

    const markers: any[] = [];

    mappedFarmers.forEach((farmer) => {
      const lat = farmer.latitude;
      const lng = farmer.longitude;
      if (!lat || !lng) return;

      // Define custom green marker indicator
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `<div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-[0_0_8px_#10b981] animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      const popupDiv = document.createElement("div");
      popupDiv.className = "p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 min-w-[160px]";
      popupDiv.innerHTML = `
        <h4 class="font-bold text-xs text-white">${farmer.fullName}</h4>
        <p class="text-[10px] text-zinc-400 mt-0.5">${farmer.barangay} • ${farmer.cropType}</p>
        <p class="text-[9px] text-emerald-400 mt-1 font-mono">${farmer.rsbsaId}</p>
        <button class="mt-2 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 py-1 text-center text-[10px] font-bold text-zinc-950 transition">
          View Detail Profile
        </button>
      `;

      popupDiv.querySelector("button")?.addEventListener("click", () => {
        onSelectFarmer(farmer.id);
        onViewProfile();
      });

      marker.bindPopup(popupDiv);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
    };
  }, [farmers]);

  return (
    <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl h-[calc(100vh-220px)] min-h-[550px] flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4 z-10">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider">GIS Map Locator</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Geospatial parcel plotting across Talacogon, Agusan del Sur.</p>
        </div>
        <div className="text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full text-emerald-400 font-bold border border-emerald-500/20">
          {farmers.filter((f) => f.latitude && f.longitude).length} Plots Geotagged
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full flex-1 rounded-[1.5rem] z-0 overflow-hidden" />
    </div>
  );
}
