import type { FarmerListItem } from "../../types/farmer.types";

interface FarmerListProps {
  farmers: FarmerListItem[];
  selectedFarmerId: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectFarmer: (id: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-850" />
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
  onSelectFarmer,
  isLoading,
  isFetching,
  error,
  page,
  totalPages,
  onPageChange,
}: FarmerListProps) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
      <div className="border-b border-zinc-800 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400" htmlFor="farmer-search">
          Filter Farmers
        </label>
        <div className="mt-2 relative">
          <input
            id="farmer-search"
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or barangay"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-white placeholder-zinc-650 outline-none transition focus:border-emerald-500"
          />
        </div>
        {isFetching ? <p className="mt-2 text-[10px] text-zinc-500 font-semibold">Updating directories...</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-350">
            {error}
          </div>
        ) : farmers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-500 font-medium">
            No farm profiles found.
          </div>
        ) : (
          <ul className="space-y-3">
            {farmers.map((farmer) => {
              const isSelected = farmer.id === selectedFarmerId;

              return (
                <li key={farmer.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFarmer(farmer.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-400">
                      {farmer.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{farmer.fullName}</p>
                      <p className="truncate text-xs text-zinc-500 mt-0.5">
                        {farmer.barangay} • <span className="text-emerald-500">{farmer.cropType}</span>
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-xl border border-zinc-850 bg-zinc-950 px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-zinc-500 font-bold uppercase tracking-wider">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-xl border border-zinc-850 bg-zinc-950 px-3 py-2 text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
