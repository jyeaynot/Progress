import { useState } from "react";

export function HarvestRecordsView() {
  const [showModal, setShowModal] = useState(false);
  const [harvests, setHarvests] = useState([
    { id: "H-501", rsbsa: "16-03-09-012", name: "Fermin V. Corvera", crop: "Rice", quantity: "4,500 kg", area: "1.5 ha", date: "2026-05-02" },
    { id: "H-502", rsbsa: "16-03-09-088", name: "Maria L. Santos", crop: "Corn", quantity: "6,200 kg", area: "2.0 ha", date: "2026-05-05" },
    { id: "H-503", rsbsa: "16-03-09-002", name: "Gabriel T. Alaba", crop: "Coconut", quantity: "8,500 kg", area: "3.5 ha", date: "2026-05-08" },
    { id: "H-504", rsbsa: "16-03-09-112", name: "Renato D. Reyes", crop: "Rice", quantity: "3,100 kg", area: "1.2 ha", date: "2026-05-12" }
  ]);

  const [newHarvest, setNewHarvest] = useState({
    rsbsa: "",
    name: "",
    crop: "Rice",
    quantity: "",
    area: ""
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHarvest.rsbsa || !newHarvest.name) return;
    const record = {
      id: `H-${Math.floor(500 + Math.random() * 500)}`,
      rsbsa: newHarvest.rsbsa,
      name: newHarvest.name,
      crop: newHarvest.crop,
      quantity: `${parseFloat(newHarvest.quantity).toLocaleString()} kg`,
      area: `${newHarvest.area} ha`,
      date: new Date().toISOString().split("T")[0]
    };
    setHarvests([record, ...harvests]);
    setShowModal(false);
    setNewHarvest({ rsbsa: "", name: "", crop: "Rice", quantity: "", area: "" });
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-wider text-white">Harvest Records</h3>
          <p className="text-xs text-zinc-400">Track agricultural production and harvest logs across barangays.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 px-6 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all active:scale-[0.98]"
        >
          + Record Harvest
        </button>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Harvest Volume</span>
          <h4 className="text-3xl font-black mt-2 text-white">22,300 kg</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Average Yield/Hectare</span>
          <h4 className="text-3xl font-black mt-2 text-emerald-400">2,720 kg/ha</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Harvested Area</span>
          <h4 className="text-3xl font-black mt-2 text-white">8.2 ha</h4>
        </div>
      </div>

      {/* Harvest log table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">RSBSA ID</th>
                <th className="py-4 px-6">Farmer Name</th>
                <th className="py-4 px-6">Crop</th>
                <th className="py-4 px-6">Harvest Qty</th>
                <th className="py-4 px-6">Cultivated Area</th>
                <th className="py-4 px-6">Date Mapped</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {harvests.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-850/40 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-zinc-400">{item.id}</td>
                  <td className="py-4 px-6 font-mono text-xs text-zinc-300">{item.rsbsa}</td>
                  <td className="py-4 px-6 font-bold text-white">{item.name}</td>
                  <td className="py-4 px-6 text-zinc-300">{item.crop}</td>
                  <td className="py-4 px-6 text-emerald-450 font-bold">{item.quantity}</td>
                  <td className="py-4 px-6 text-zinc-400">{item.area}</td>
                  <td className="py-4 px-6 text-zinc-400 font-mono text-xs">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Harvest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl">
            <h4 className="text-lg font-black text-white uppercase tracking-wider mb-4">Record New Harvest</h4>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">RSBSA ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 16-03-09-012"
                  value={newHarvest.rsbsa}
                  onChange={(e) => setNewHarvest({ ...newHarvest, rsbsa: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Farmer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria L. Santos"
                  value={newHarvest.name}
                  onChange={(e) => setNewHarvest({ ...newHarvest, name: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Crop</label>
                <select
                  value={newHarvest.crop}
                  onChange={(e) => setNewHarvest({ ...newHarvest, crop: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                >
                  <option value="Rice">Rice</option>
                  <option value="Corn">Corn</option>
                  <option value="Banana">Banana</option>
                  <option value="Cacao">Cacao</option>
                  <option value="Coconut">Coconut</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Harvest Qty (kg)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5200"
                  value={newHarvest.quantity}
                  onChange={(e) => setNewHarvest({ ...newHarvest, quantity: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Area Cultivated (ha)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1.8"
                  value={newHarvest.area}
                  onChange={(e) => setNewHarvest({ ...newHarvest, area: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
