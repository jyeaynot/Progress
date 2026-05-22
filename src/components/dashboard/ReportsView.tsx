import { useState } from "react";

export function ReportsView() {
  const [reports, setReports] = useState([
    { id: "REP-492", name: "Poblacion Farmer Masterlist", type: "Farmer Masterlist", date: "2026-05-18", format: "PDF", size: "1.4 MB", author: "M. Antonio" },
    { id: "REP-493", name: "First Quarter Crop Yield Summary", type: "Crop Production", date: "2026-05-19", format: "CSV", size: "245 KB", author: "M. Antonio" },
    { id: "REP-494", name: "First Quarter Input Distribution Log", type: "Input Allocation", date: "2026-05-20", format: "PDF", size: "890 KB", author: "M. Antonio" }
  ]);

  const [form, setForm] = useState({
    type: "Farmer Masterlist",
    barangay: "All Barangays",
    range: "May 2026",
    format: "PDF"
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport = {
      id: `REP-${Math.floor(495 + Math.random() * 100)}`,
      name: `${form.barangay} ${form.type} - ${form.range}`,
      type: form.type,
      date: new Date().toISOString().split("T")[0],
      format: form.format,
      size: `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
      author: "M. Antonio"
    };
    setReports([newReport, ...reports]);
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div>
        <h3 className="text-xl font-black uppercase tracking-wider text-white">Reports</h3>
        <p className="text-xs text-zinc-400">Generate, request, and export system summaries and geospatial logs.</p>
      </div>

      {/* Reports Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Report Requests</span>
          <h4 className="text-2xl font-black mt-1 text-white">128</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Exported Logs</span>
          <h4 className="text-2xl font-black mt-1 text-white">14</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Generated Reports</span>
          <h4 className="text-2xl font-black mt-1 text-white">52</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Active Export Filters</span>
          <h4 className="text-2xl font-black mt-1 text-emerald-450">12</h4>
        </div>
      </div>

      {/* Config Form and History log split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
        {/* Generator Form */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">Configure Report</h4>
            <p className="text-xs text-zinc-400 mb-6">Select parameters to synthesize a CSV or PDF ledger.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Report Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
              >
                <option value="Farmer Masterlist">Farmer Masterlist</option>
                <option value="Crop Production">Crop Production</option>
                <option value="Input Allocation">Input Allocation</option>
                <option value="Damage & Calamity Logs">Damage &amp; Calamity Logs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Barangay Scope</label>
              <select
                value={form.barangay}
                onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
              >
                <option value="All Barangays">All Barangays</option>
                <option value="Poblacion">Poblacion</option>
                <option value="San Jose">San Jose</option>
                <option value="Del Monte">Del Monte</option>
                <option value="San Vicente">San Vicente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Date Period</label>
              <select
                value={form.range}
                onChange={(e) => setForm({ ...form, range: e.target.value })}
                className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
              >
                <option value="May 2026">May 2026</option>
                <option value="April 2026">April 2026</option>
                <option value="First Quarter 2026">First Quarter 2026</option>
                <option value="Year 2026">Full Year 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Output Format</label>
              <div className="flex gap-4 mt-2">
                {["PDF", "CSV"].map((fmt) => (
                  <label key={fmt} className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={form.format === fmt}
                      onChange={() => setForm({ ...form, format: fmt })}
                      className="accent-emerald-500"
                    />
                    {fmt} Documents
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition active:scale-[0.98]"
            >
              Generate Report
            </button>
          </form>
        </div>

        {/* History Logs */}
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">Export History</h4>
            <div className="space-y-4">
              {reports.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between hover:border-zinc-700 transition">
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                    <p className="text-[10px] text-zinc-500 mt-1 font-semibold uppercase tracking-wider">
                      {item.type} • {item.date} • {item.author}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-zinc-450 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {item.format} ({item.size})
                    </span>
                    <button className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
