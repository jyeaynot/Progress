import { useEffect, useRef, useState } from "react";

interface MapSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

export function MapSelector({ latitude, longitude, onChange }: MapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [latitudeInput, setLatitudeInput] = useState(latitude?.toString() ?? "");
  const [longitudeInput, setLongitudeInput] = useState(longitude?.toString() ?? "");

  useEffect(() => {
    setLatitudeInput(latitude?.toString() ?? "");
    setLongitudeInput(longitude?.toString() ?? "");
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Access Leaflet from window object
    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet is not loaded.");
      return;
    }

    const defaultLat = latitude ?? 8.1297; // Talacogon, Agusan del Sur
    const defaultLng = longitude ?? 125.3962;

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
      setLatitudeInput(position.lat.toString());
      setLongitudeInput(position.lng.toString());
      onChange({ latitude: position.lat, longitude: position.lng });
    });

    // Listen to map click to position marker
    map.on("click", (e: any) => {
      const position = e.latlng;
      marker.setLatLng(position);
      setLatitudeInput(position.lat.toString());
      setLongitudeInput(position.lng.toString());
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
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined && markerInstanceRef.current && mapInstanceRef.current) {
      const currentPos = markerInstanceRef.current.getLatLng();
      if (currentPos.lat !== latitude || currentPos.lng !== longitude) {
        markerInstanceRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  function syncFromInputs(nextLatitude: string, nextLongitude: string) {
    const parsedLatitude = Number(nextLatitude);
    const parsedLongitude = Number(nextLongitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return;
    }

    onChange({ latitude: parsedLatitude, longitude: parsedLongitude });
  }

  return (
    <div className="space-y-3">
      <div className="ui-card p-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          <span>Click map or drag marker to set GIS Location</span>
          {latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="ui-label">Latitude</label>
            <input
              type="number"
              step="any"
              value={latitudeInput}
              onChange={(e) => {
                const nextLatitude = e.target.value;
                setLatitudeInput(nextLatitude);
                syncFromInputs(nextLatitude, longitudeInput);
              }}
              className="ui-input"
            />
          </div>
          <div>
            <label className="ui-label">Longitude</label>
            <input
              type="number"
              step="any"
              value={longitudeInput}
              onChange={(e) => {
                const nextLongitude = e.target.value;
                setLongitudeInput(nextLongitude);
                syncFromInputs(latitudeInput, nextLongitude);
              }}
              className="ui-input"
            />
          </div>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        className="h-[250px] w-full rounded-[1.5rem] border border-white/10 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.75)] z-10"
      />
    </div>
  );
}
