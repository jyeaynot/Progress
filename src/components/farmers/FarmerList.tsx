import type { FarmerListItem } from "../../types/farmer.types";

interface FarmerListProps {
  farmers: FarmerListItem[];
  selectedFarmerId: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedCropType: string;
  onCropTypeChange: (value: string) => void;
  onSelectFarmer: (id: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CROP_OPTIONS = [
  { value: "", label: "All crops" },
  { value: "Rice", label: "Rice" },
  { value: "Corn", label: "Corn" },
  { value: "Coconut", label: "Coconut" },
  { value: "Vegetables", label: "Vegetables" },
  { value: "Banana", label: "Banana" },
  { value: "Cacao", label: "Cacao" },
];

function getInitialsColor(initials: string) {
  const charCode = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  const colors = [
    "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    "bg-sky-500/15 border-sky-500/30 text-sky-400",
    "bg-amber-500/15 border-amber-500/30 text-amber-400",
    "bg-violet-500/15 border-violet-500/30 text-violet-400",
    "bg-rose-500/15 border-rose-500/30 text-rose-400",
    "bg-pink-500/15 border-pink-500/30 text-pink-400",
    "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
    "bg-teal-500/15 border-teal-500/30 text-teal-400"
  ];
  return colors[charCode % colors.length];
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FarmerList({
  farmers,
  selectedFarmerId,
  searchValue,
  onSearchChange,
  selectedCropType,
  onCropTypeChange,
  onSelectFarmer,
  isLoading,
  isFetching,
  error,
  page,
  totalPages,
  onPageChange,
}: FarmerListProps) {
  return (
    <section className="ui-panel-strong flex h-full flex-col overflow-hidden">
      {/* Header Info matching Figma */}
      <div className="border-b border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">All Farmers</h3>
            <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">Click a row to view profile</p>
          </div>
          <div className="relative">
            <select
              value={selectedCropType}
              onChange={(e) => onCropTypeChange(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-300 outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              {CROP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar with Icon */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            id="farmer-search"
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name or barangay..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/85 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
          />
        </div>
        
        {isFetching ? (
          <p className="text-[10px] font-semibold text-emerald-400 animate-pulse">Updating directories...</p>
        ) : null}
      </div>

      {/* Main List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : farmers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-xs font-semibold text-zinc-500">
            No farm profiles found.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {farmers.map((farmer) => {
              const isSelected = farmer.id === selectedFarmerId;

              return (
                <li key={farmer.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFarmer(farmer.id)}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition duration-200 ${
                      isSelected
                        ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_12px_24px_-16px_rgba(16,185,129,0.5)]"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border text-xs font-black ${getInitialsColor(farmer.initials)}`}>
                      {farmer.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white tracking-wide">{farmer.fullName}</p>
                      <p className="mt-0.5 truncate text-[10px] text-zinc-500 font-medium tracking-wide">
                        {farmer.barangay} • <span className="text-emerald-400 font-semibold">{farmer.cropType}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        Active
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="ui-btn-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
        >
          Prev
        </button>
        <span className="font-bold uppercase tracking-[0.15em] text-zinc-500 text-[10px]">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="ui-btn-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
        >
          Next
        </button>
      </div>
    </section>
  );
}
