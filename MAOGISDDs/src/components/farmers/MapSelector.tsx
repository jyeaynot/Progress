import { useEffect, useRef } from "react";

interface MapSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

export function MapSelector({ latitude, longitude, onChange }: MapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Access Leaflet from window object
    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet is not loaded.");
      return;
    }

    const defaultLat = latitude || 8.1297; // Talacogon, Agusan del Sur
    const defaultLng = longitude || 125.3962;

    // Create map instance
    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

    // Add OSM tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create marker
    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
    }).addTo(map);
    markerInstanceRef.current = marker;

    // Listen to dragend
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      onChange({ latitude: position.lat, longitude: position.lng });
    });

    // Listen to map click to position marker
    map.on("click", (e: any) => {
      const position = e.latlng;
      marker.setLatLng(position);
      onChange({ latitude: position.lat, longitude: position.lng });
    });

    // Make sure map sizes properly after render
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (latitude && longitude && markerInstanceRef.current && mapInstanceRef.current) {
      const currentPos = markerInstanceRef.current.getLatLng();
      if (currentPos.lat !== latitude || currentPos.lng !== longitude) {
        markerInstanceRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>Click map or drag marker to set GIS Location</span>
        {latitude && longitude && (
          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </div>
      <div
        ref={mapContainerRef}
        className="h-[250px] w-full rounded-2xl border border-slate-200 shadow-inner z-10"
      />
    </div>
  );
}
