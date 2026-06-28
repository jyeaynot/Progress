import { useMemo } from "react";
import type { FarmerListItem } from "../../types/farmer.types";

interface DashboardViewProps {
  farmers: FarmerListItem[];
}

export function DashboardView({ farmers }: DashboardViewProps) {
  // Aggregate Stats
  const totalFarmersCount = 1200; // Hardcoded or dynamic scale relative to Figma Frame 1
  const totalLandArea = 2432.50; // ha
  const activeCropsCount = 350;

  // Crop Distribution details matching Figma
  const cropsData = [
    { name: "Rice", count: 480, color: "bg-emerald-500", barColor: "#10b981", percent: 40 },
    { name: "Corn", count: 360, color: "bg-amber-500", barColor: "#f59e0b", percent: 30 },
    { name: "Banana", count: 180, color: "bg-yellow-400", barColor: "#facc15", percent: 15 },
    { name: "Cacao", count: 96, color: "bg-red-500", barColor: "#ef4444", percent: 8 },
    { name: "Coconut", count: 84, color: "bg-blue-400", barColor: "#60a5fa", percent: 7 }
  ];

  // Allocation metrics breakdown matching Figma Frame 1
  const allocationsData = [
    { name: "Seeds Subsidy", value: 345000, color: "bg-emerald-500", barColor: "#10b981", percent: 35 },
    { name: "Fertilizer Support", value: 295000, color: "bg-amber-500", barColor: "#f59e0b", percent: 30 },
    { name: "Pesticides Aid", value: 148000, color: "bg-rose-500", barColor: "#f43f5e", percent: 15 },
    { name: "Farm Equipment", value: 118000, color: "bg-blue-500", barColor: "#3b82f6", percent: 12 },
    { name: "Irrigation Subsidy", value: 78000, color: "bg-indigo-500", barColor: "#6366f1", percent: 8 }
  ];

  const totalAllocationSum = useMemo(() => {
    return allocationsData.reduce((acc, curr) => acc + curr.value, 0);
  }, []);

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="ui-panel-strong relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-600" />
          <div className="absolute -right-2 -top-2 p-4 opacity-10">
            <svg className="h-24 w-24 text-emerald-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">Total Registered Farmers</span>
              <h3 className="mt-3 text-4xl font-black text-white">{totalFarmersCount.toLocaleString()}</h3>
            </div>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-emerald-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="mt-5 text-xs font-semibold text-emerald-300/80">Active in RSBSA database</p>
        </div>

        <div className="ui-panel-strong relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500" />
          <div className="absolute -right-2 -top-2 p-4 opacity-10">
            <svg className="h-24 w-24 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
            </svg>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">Total Cultivated Area</span>
              <h3 className="mt-3 text-4xl font-black text-white">
                {totalLandArea.toFixed(2)} <span className="text-lg font-medium text-zinc-500">ha</span>
              </h3>
            </div>
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-3 text-amber-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
              </svg>
            </div>
          </div>
          <p className="mt-5 text-xs font-semibold text-amber-300/80">Georeferenced farm plots</p>
        </div>

        <div className="ui-panel-strong relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-300 via-cyan-400 to-emerald-400" />
          <div className="absolute -right-2 -top-2 p-4 opacity-10">
            <svg className="h-24 w-24 text-sky-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">Active Monitored Fields</span>
              <h3 className="mt-3 text-4xl font-black text-white">{activeCropsCount}</h3>
            </div>
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/10 p-3 text-sky-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="mt-5 text-xs font-semibold text-sky-300/80">Registered this crop season</p>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Crop Distribution Card */}
        <div className="ui-panel-strong p-6">
          <h4 className="text-lg font-black uppercase tracking-[0.2em] text-white">Crop Distribution &amp; Types</h4>
          <p className="mb-6 mt-2 text-xs text-zinc-400">Percentage share of primary cultivated crops across mapped barangays.</p>
          
          <div className="space-y-4">
            {cropsData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-zinc-300">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.name}
                  </span>
                  <span className="text-zinc-400">{item.count} Farmers ({item.percent}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${item.percent}%`,
                      backgroundColor: item.barColor 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Allocation Value Card */}
        <div className="ui-panel-strong flex flex-col justify-between p-6">
          <div>
            <h4 className="text-lg font-black uppercase tracking-[0.2em] text-white">Agricultural Aid Allocations</h4>
            <p className="mb-6 mt-2 text-xs text-zinc-400">Aggregate monetary distribution of farm inputs, tools, and subsidies.</p>
          </div>

          <div className="space-y-4">
            {allocationsData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">{item.name}</span>
                  <span className="text-zinc-400">₱{item.value.toLocaleString()} ({item.percent}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${item.percent}%`,
                      backgroundColor: item.barColor 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Valuation</span>
            <span className="text-xl font-black text-emerald-400">₱{totalAllocationSum.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
