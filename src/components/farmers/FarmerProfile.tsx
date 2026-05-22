import { useEffect, useRef } from "react";
import type { FarmerProfile as FarmerProfileType, InputAllocation } from "../../types/farmer.types";

interface FarmerProfileProps {
  farmer?: FarmerProfileType | null;
  isLoading?: boolean;
  error?: string | null;
  onEditClick: (farmer: FarmerProfileType) => void;
  onDeleteClick: (id: string) => void;
  onAddAllocationClick: (id: string, name: string) => void;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value ?? "-"}</p>
    </div>
  );
}

function AllocationCard({ label, value }: { label: string; value: InputAllocation[keyof InputAllocation] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-black text-emerald-450">{value ?? "-"}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-3xl bg-zinc-900" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-zinc-900/50" />
        ))}
      </div>
    </div>
  );
}

export function FarmerProfile({
  farmer,
  isLoading,
  error,
  onEditClick,
  onDeleteClick,
  onAddAllocationClick,
}: FarmerProfileProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!farmer || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet was not loaded.");
      return;
    }

    const lat = farmer.gisLocation?.latitude;
    const lng = farmer.gisLocation?.longitude;

    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      return;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([lat, lng], 14);
    mapInstanceRef.current = map;

    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    // Apply the dark map styling
    tiles.getContainer()?.classList.add("dark-map-tiles");

    const customIcon = L.divIcon({
      className: "custom-profile-marker",
      html: `<div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-[0_0_8px_#10b981] animate-pulse"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b class="text-zinc-900">${farmer.fullName}</b><br/><span class="text-zinc-650">${farmer.barangay}</span>`).openPopup();

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [farmer]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-350">
        {error}
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900 p-8 text-center">
        <div>
          <p className="text-lg font-black text-white uppercase tracking-wider">Select a farmer</p>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm">
            Select a farm profile to view coordinates, registered RSBSA records, allocations, and live crop tracking.
          </p>
        </div>
      </div>
    );
  }

  const allocations = farmer.inputAllocations ?? [];
  const hasCoordinates =
    farmer.gisLocation?.latitude !== null &&
    farmer.gisLocation?.latitude !== undefined &&
    farmer.gisLocation?.longitude !== null &&
    farmer.gisLocation?.longitude !== undefined;

  return (
    <div className="space-y-6 text-zinc-150">
      {/* Profile Header & Actions */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              Farmer Profile
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">{farmer.fullName}</h2>
            <p className="mt-1 text-xs font-semibold text-zinc-400">
              {farmer.barangay} • <span className="text-emerald-400">{farmer.cropType}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-2xl bg-zinc-950 border border-zinc-850 px-4 py-3 text-sm text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">RSBSA ID</p>
              <p className="mt-1 font-mono text-xs font-bold text-white">{farmer.rsbsaId}</p>
            </div>
            {/* Quick Actions */}
            <div className="flex gap-2 w-full justify-end">
              <button
                type="button"
                onClick={() => onEditClick(farmer)}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-900"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDeleteClick(farmer.id)}
                className="inline-flex items-center justify-center rounded-xl border border-rose-500/25 bg-zinc-950 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-950/40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailRow label="Barangay" value={farmer.barangay} />
        <DetailRow label="Contact number" value={farmer.contactNumber} />
        <DetailRow label="Civil status" value={farmer.civilStatus} />
        <DetailRow label="Ethnicity" value={farmer.ethnicity} />
        <DetailRow label="Age" value={farmer.age ?? "-"} />
        <DetailRow label="Crop Type" value={farmer.farmDetails.cropType} />
      </div>

      {/* Input Allocations */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Input Allocation History</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Records linked from dynamic distributions.</p>
          </div>
          <button
            type="button"
            onClick={() => onAddAllocationClick(farmer.id, farmer.fullName)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition"
          >
            + Add Allocation
          </button>
        </div>

        {allocations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-xs text-zinc-500 font-medium">
            No allocation records found for this farmer.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {allocations.map((allocation) => (
              <div key={allocation.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <AllocationCard label="Fertilizer" value={allocation.fertilizer} />
                  <AllocationCard label="Seeds" value={allocation.seeds} />
                  <AllocationCard label="Farm Tools" value={allocation.farmTools} />
                  <AllocationCard label="Pesticides" value={allocation.pesticides} />
                  <AllocationCard label="Irrigation" value={allocation.irrigationSubsidy} />
                </div>
                {allocation.notes && (
                  <p className="mt-3 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800/80 p-2.5 rounded-xl">
                    <span className="font-bold text-zinc-300">Notes:</span> {allocation.notes}
                  </p>
                )}
                {allocation.allocatedAt ? (
                  <p className="mt-3 text-[10px] text-zinc-500 font-semibold">
                    Distributed: {new Date(allocation.allocatedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GIS Location with Live Map */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Geotagging details</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Crop field location plotted via OpenStreetMap satellite data.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          {hasCoordinates ? (
            <div
              ref={mapContainerRef}
              className="min-h-[280px] w-full overflow-hidden rounded-2xl border border-zinc-800 z-10"
            />
          ) : (
            <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
              <div className="text-center p-6">
                <span className="mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 w-10 h-10 flex items-center justify-center text-lg font-bold mb-2">
                  !
                </span>
                <p className="text-sm font-bold text-white">No GIS Coordinates Plotted</p>
                <p className="text-xs text-zinc-500 mt-1">Please edit the farmer profile to geo-locate this crop plot.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <DetailRow label="Latitude" value={farmer.gisLocation?.latitude ?? "-"} />
            <DetailRow label="Longitude" value={farmer.gisLocation?.longitude ?? "-"} />
            <DetailRow label="Location label" value={farmer.gisLocation?.label ?? farmer.barangay ?? "-"} />
          </div>
        </div>
      </div>
    </div>
  );
}

