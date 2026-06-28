import { useState } from "react";

export function CropHealthView() {
  const [ndviScore, setNdviScore] = useState(70); // 70% Good
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ndviScore / 100) * circumference;

  const alerts = [
    { id: 1, barangay: "Poblacion", message: "Low moisture detected in Rice fields.", level: "Warning", time: "2 hours ago" },
    { id: 2, barangay: "San Jose", message: "Possible armyworm infestation risk based on humidity spikes.", level: "Danger", time: "5 hours ago" },
    { id: 3, barangay: "Del Monte", message: "Excellent NDVI indices mapped for Corn plantations.", level: "Optimal", time: "1 day ago" }
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div>
        <h3 className="text-xl font-black uppercase tracking-wider text-white">Crop Health Monitor</h3>
        <p className="text-xs text-zinc-400">Satellite-based vegetation index (NDVI), meteorological metrics, and agricultural risks.</p>
      </div>

      {/* Dials & Gauges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NDVI Radial Card */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl flex flex-col items-center justify-between text-center">
          <div className="w-full text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">NDVI Health Index</span>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-zinc-850 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-white">{ndviScore}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-450">Good Condition</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400">Mean vegetation thickness compared to last crop cycle.</p>
        </div>

        {/* Meteorological metrics */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Agricultural Weather Monitor</span>
            <p className="text-xs text-zinc-400 mt-1">Live crop climate observations in Talacogon.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Air Temp</span>
              <p className="text-lg font-black text-white mt-1">31°C</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Precipitation</span>
              <p className="text-lg font-black text-white mt-1">2.4 mm/day</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Soil Moisture</span>
              <p className="text-lg font-black text-emerald-400 mt-1">42%</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Humidity</span>
              <p className="text-lg font-black text-white mt-1">84%</p>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider text-center">Sensor nodes synced: OK</p>
        </div>

        {/* Soil health distribution */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Soil Condition Types</span>
            <p className="text-xs text-zinc-400 mt-1">Classification of monitored plots soil quality.</p>
          </div>

          <div className="space-y-3 my-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-zinc-300">
                <span>Clayey (optimal water retention)</span>
                <span>55%</span>
              </div>
              <div className="w-full h-2 rounded bg-zinc-950 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded" style={{ width: "55%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-zinc-300">
                <span>Loamy (high nutrient levels)</span>
                <span>30%</span>
              </div>
              <div className="w-full h-2 rounded bg-zinc-950 overflow-hidden">
                <div className="h-full bg-amber-500 rounded" style={{ width: "30%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-zinc-300">
                <span>Sandy (low retention risk)</span>
                <span>15%</span>
              </div>
              <div className="w-full h-2 rounded bg-zinc-950 overflow-hidden">
                <div className="h-full bg-rose-500 rounded" style={{ width: "15%" }} />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider text-center">Plot evaluations: 350 active</p>
        </div>
      </div>

      {/* Alerts lists */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">Active Crop Health &amp; Risk Alerts</h4>
        <div className="space-y-3">
          {alerts.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    item.level === "Danger"
                      ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                      : item.level === "Warning"
                      ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                      : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  }`}
                />
                <div>
                  <h5 className="text-xs font-bold text-white">Barangay {item.barangay}</h5>
                  <p className="text-xs text-zinc-400 mt-0.5">{item.message}</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
