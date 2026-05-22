import { useState } from "react";

export function CalamityDamageView() {
  const [showModal, setShowModal] = useState(false);
  const [damages, setDamages] = useState([
    { id: "DM-201", rsbsa: "16-03-09-012", name: "Fermin V. Corvera", barangay: "Poblacion", type: "Flood", value: 45000, area: "1.2 ha", status: "Validated" },
    { id: "DM-202", rsbsa: "16-03-09-088", name: "Maria L. Santos", barangay: "San Jose", type: "Typhoon", value: 68000, area: "1.8 ha", status: "Validated" },
    { id: "DM-203", rsbsa: "16-03-09-034", name: "Juan P. Dela Cruz", barangay: "Del Monte", type: "Pests (Armyworm)", value: 24050, area: "0.8 ha", status: "Pending" }
  ]);

  const [newDamage, setNewDamage] = useState({
    rsbsa: "",
    name: "",
    barangay: "Poblacion",
    type: "Flood",
    value: "",
    area: ""
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDamage.rsbsa || !newDamage.name) return;
    const record = {
      id: `DM-${Math.floor(200 + Math.random() * 800)}`,
      rsbsa: newDamage.rsbsa,
      name: newDamage.name,
      barangay: newDamage.barangay,
      type: newDamage.type,
      value: parseFloat(newDamage.value) || 0,
      area: `${newDamage.area || 0} ha`,
      status: "Pending"
    };
    setDamages([record, ...damages]);
    setShowModal(false);
    setNewDamage({ rsbsa: "", name: "", barangay: "Poblacion", type: "Flood", value: "", area: "" });
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-wider text-white">Calamity &amp; Damage</h3>
          <p className="text-xs text-zinc-400">Log damage declarations and agricultural assistance validations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 px-6 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all active:scale-[0.98]"
        >
          + File Damage Report
        </button>
      </div>

      {/* Metric stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Estimated Loss Valuation</span>
          <h4 className="text-3xl font-black mt-2 text-rose-450">₱137,050</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Affected Area</span>
          <h4 className="text-3xl font-black mt-2 text-white">3.8 ha</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Validated Claims</span>
          <h4 className="text-3xl font-black mt-2 text-emerald-400">2 / 3 Reports</h4>
        </div>
      </div>

      {/* Damages log table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">RSBSA ID</th>
                <th className="py-4 px-6">Farmer Name</th>
                <th className="py-4 px-6">Barangay</th>
                <th className="py-4 px-6">Calamity Type</th>
                <th className="py-4 px-6">Estimated Damage</th>
                <th className="py-4 px-6">Affected Area</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {damages.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-850/40 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-zinc-400">{item.id}</td>
                  <td className="py-4 px-6 font-mono text-xs text-zinc-300">{item.rsbsa}</td>
                  <td className="py-4 px-6 font-bold text-white">{item.name}</td>
                  <td className="py-4 px-6 text-zinc-300">{item.barangay}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-semibold text-zinc-300">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-rose-450 font-bold">₱{item.value.toLocaleString()}</td>
                  <td className="py-4 px-6 text-zinc-400">{item.area}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "Validated"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Damage Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl">
            <h4 className="text-lg font-black text-white uppercase tracking-wider mb-4">File Calamity Damage</h4>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">RSBSA ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 16-03-09-012"
                  value={newDamage.rsbsa}
                  onChange={(e) => setNewDamage({ ...newDamage, rsbsa: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Farmer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria L. Santos"
                  value={newDamage.name}
                  onChange={(e) => setNewDamage({ ...newDamage, name: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Barangay</label>
                <select
                  value={newDamage.barangay}
                  onChange={(e) => setNewDamage({ ...newDamage, barangay: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                >
                  <option value="Poblacion">Poblacion</option>
                  <option value="San Jose">San Jose</option>
                  <option value="Del Monte">Del Monte</option>
                  <option value="San Vicente">San Vicente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Calamity Type</label>
                <select
                  value={newDamage.type}
                  onChange={(e) => setNewDamage({ ...newDamage, type: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                >
                  <option value="Flood">Flood</option>
                  <option value="Typhoon">Typhoon</option>
                  <option value="Drought">Drought</option>
                  <option value="Pests (Armyworm)">Pests (Armyworm)</option>
                  <option value="Landslide">Landslide</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Loss Value (PHP)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 35000"
                  value={newDamage.value}
                  onChange={(e) => setNewDamage({ ...newDamage, value: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Affected Area Size (ha)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1.5"
                  value={newDamage.area}
                  onChange={(e) => setNewDamage({ ...newDamage, area: e.target.value })}
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
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
