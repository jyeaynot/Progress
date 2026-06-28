import { useEffect, useRef } from "react";
import type { FarmerProfile as FarmerProfileType } from "../../types/farmer.types";

interface FarmerProfileProps {
  farmer?: FarmerProfileType | null;
  isLoading?: boolean;
  error?: string | null;
  onEditClick: (farmer: FarmerProfileType) => void;
  onDeleteClick: (id: string) => void;
  onAddAllocationClick: (id: string, name: string) => void;
  onAllocationStatusChange?: (farmerId: string, allocationId: string, status: "Pending" | "Received") => void;
}

function deriveGender(fullName: string): string {
  const firstName = fullName.split(" ")[0]?.toLowerCase() || "";
  const femaleNames = ["maria", "mary", "elena", "ana", "liza", "jessica", "sarah", "jane", "rose", "ana", "flores"];
  if (femaleNames.some(name => firstName.includes(name)) || firstName.endsWith("a") || firstName.endsWith("ia")) {
    return "Female";
  }
  return "Male";
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 rounded-3xl bg-zinc-900" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-16 rounded-2xl bg-zinc-900/50" />
        ))}
      </div>
      <div className="h-32 rounded-2xl bg-zinc-900/30" />
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
  onAllocationStatusChange,
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
    marker.bindPopup(`<b class="text-zinc-900">${farmer.fullName}</b>`).openPopup();

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
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
        <div>
          <p className="text-lg font-black text-white uppercase tracking-wider">Select a farmer</p>
          <p className="mt-2 text-xs text-zinc-500 max-w-sm mx-auto">
            Select a farm profile from the list to view demographics, registered RSBSA records, input allocations, and coordinate map.
          </p>
        </div>
      </div>
    );
  }

  const allocations = farmer.inputAllocations ?? [];
  const cropRecords = farmer.cropRecords ?? [];
  const latestCropRecord = cropRecords[0] ?? null;

  const hasCoordinates =
    farmer.gisLocation?.latitude !== null &&
    farmer.gisLocation?.latitude !== undefined &&
    farmer.gisLocation?.longitude !== null &&
    farmer.gisLocation?.longitude !== undefined;

  // Build input allocations tags that are received
  const receivedAllocations: string[] = [];
  allocations.forEach(alloc => {
    if (alloc.status === "Received") {
      if (alloc.fertilizer) receivedAllocations.push(`Fertilizer: ${alloc.fertilizer}`);
      if (alloc.seeds) receivedAllocations.push(`Seeds: ${alloc.seeds}`);
      if (alloc.farmTools) receivedAllocations.push(`Farm Tools: ${alloc.farmTools}`);
      if (alloc.pesticides) receivedAllocations.push(`Pesticides: ${alloc.pesticides}`);
      if (alloc.irrigationSubsidy) receivedAllocations.push(`Irrigation: ${alloc.irrigationSubsidy}`);
    }
  });

  return (
    <div className="ui-panel-strong p-6 space-y-6 text-zinc-200">
      
      {/* Profile Header Details card */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-lg font-black text-emerald-400">
            {farmer.initials}
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">{farmer.fullName}</h2>
            <p className="mt-1 font-mono text-[10px] font-bold text-zinc-400">
              RSBSA ID: <span className="text-zinc-200">{farmer.rsbsaId}</span>
            </p>
            
            {/* Outline badges below Name */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex rounded-full border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                {farmer.cropType}
              </span>
              <span className="inline-flex rounded-full border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                Active
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                hasCoordinates 
                  ? "border-sky-500/30 text-sky-400" 
                  : "border-amber-500/30 text-amber-400"
              }`}>
                {hasCoordinates ? "GIS mapped" : "Not mapped"}
              </span>
            </div>
          </div>
        </div>

        {/* Edit/Delete actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEditClick(farmer)}
            className="rounded-xl border border-zinc-700 bg-zinc-950/80 px-3.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={() => onDeleteClick(farmer.id)}
            className="rounded-xl border border-rose-500/25 bg-zinc-950/80 px-3.5 py-1.5 text-xs font-bold text-rose-400 transition hover:bg-rose-950/20"
          >
            DELETE
          </button>
        </div>
      </div>

      {/* Demographics Grid matching Figma */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Barangay</p>
          <p className="mt-0.5 text-xs font-bold text-white">{farmer.barangay}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Birthdate</p>
          <p className="mt-0.5 text-xs font-bold text-white">
            {farmer.birthDate ? new Date(farmer.birthDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contact</p>
          <p className="mt-0.5 text-xs font-bold text-white font-mono">{farmer.contactNumber || "-"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Gender</p>
          <p className="mt-0.5 text-xs font-bold text-white">{deriveGender(farmer.fullName)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Civil Status</p>
          <p className="mt-0.5 text-xs font-bold text-white">{farmer.civilStatus}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Association</p>
          <p className="mt-0.5 text-xs font-bold text-white">{`FFA ${farmer.barangay.replace("Brgy. ", "")}`}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ethnicity</p>
          <p className="mt-0.5 text-xs font-bold text-white">{farmer.ethnicity || "-"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Age</p>
          <p className="mt-0.5 text-xs font-bold text-white font-mono">{farmer.age ?? "-"}</p>
        </div>
      </div>

      {/* Farm Details Card with Emerald Glow/Border */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.015] p-5 shadow-[0_8px_30px_-18px_rgba(16,185,129,0.1)]">
        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3.5">Farm Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Crop Type</p>
            <p className="mt-0.5 text-xs font-bold text-white">{farmer.cropType}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Farm Area</p>
            <p className="mt-0.5 text-xs font-bold text-white font-mono">
              {latestCropRecord ? `${latestCropRecord.areaHa} ha` : "0.00 ha"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Season</p>
            <p className="mt-0.5 text-xs font-bold text-white">{farmer.season || "Wet season"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ownership</p>
            <p className="mt-0.5 text-xs font-bold text-white">Owner</p>
          </div>
        </div>
      </div>

      {/* Input Allocation Received */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Input Allocation Received</h3>
          <button
            type="button"
            onClick={() => onAddAllocationClick(farmer.id, farmer.fullName)}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-450 hover:bg-emerald-500 hover:text-zinc-950 transition"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {receivedAllocations.length > 0 ? (
            receivedAllocations.map((badge, idx) => (
              <span key={idx} className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400">
                {badge}
              </span>
            ))
          ) : (
            <p className="text-xs text-zinc-500 font-medium italic">No inputs received yet.</p>
          )}
        </div>
      </div>

      {/* GIS Location satellites plot */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">GIS Location</h3>
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          {hasCoordinates ? (
            <div
              ref={mapContainerRef}
              className="h-[200px] w-full z-10"
            />
          ) : (
            <div className="h-[200px] w-full flex items-center justify-center text-center p-6 bg-zinc-950">
              <div>
                <span className="mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 w-10 h-10 flex items-center justify-center text-lg font-bold mb-2">
                  !
                </span>
                <p className="text-xs font-bold text-white">No GIS Coordinates Plotted</p>
                <p className="text-[10px] text-zinc-500 mt-1">Please edit profile to plot field coordinates.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
