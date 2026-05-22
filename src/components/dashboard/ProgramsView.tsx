import { useState } from "react";

export function ProgramsView() {
  const [showModal, setShowModal] = useState(false);
  const [programs, setPrograms] = useState([
    { id: "PR-801", name: "RCEF Rice Seed Distribution", type: "Seeds", budget: "₱450,000", enrolled: 650, capacity: 800, progress: 81, status: "Active" },
    { id: "PR-802", name: "Organic Fertilizer Subsidy Program", type: "Fertilizer", budget: "₱320,000", enrolled: 320, capacity: 400, progress: 80, status: "Active" },
    { id: "PR-803", name: "High Value Crop Seedlings (Cacao/Coffee)", type: "Seedlings", budget: "₱180,000", enrolled: 120, capacity: 150, progress: 80, status: "Active" },
    { id: "PR-804", name: "Calamity Relief Assistance (Agusan Flood)", type: "Financial Aid", budget: "₱550,000", enrolled: 212, capacity: 250, progress: 85, status: "Active" },
    { id: "PR-805", name: "Small Farm Mechanization (Equipment Sharing)", type: "Implements", budget: "₱300,000", enrolled: 50, capacity: 50, progress: 100, status: "Completed" }
  ]);

  const [newProg, setNewProg] = useState({
    name: "",
    type: "Seeds",
    budget: "",
    capacity: ""
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProg.name || !newProg.budget) return;
    const item = {
      id: `PR-${Math.floor(800 + Math.random() * 200)}`,
      name: newProg.name,
      type: newProg.type,
      budget: `₱${parseFloat(newProg.budget).toLocaleString()}`,
      enrolled: 0,
      capacity: parseInt(newProg.capacity) || 100,
      progress: 0,
      status: "Active"
    };
    setPrograms([item, ...programs]);
    setShowModal(false);
    setNewProg({ name: "", type: "Seeds", budget: "", capacity: "" });
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-wider text-white">Programs &amp; Benefits</h3>
          <p className="text-xs text-zinc-400">Enroll farmers in governmental aids and review program execution.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 px-6 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all active:scale-[0.98]"
        >
          + Add Program
        </button>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Active Programs</span>
          <h4 className="text-3xl font-black mt-2 text-white">6 Programs</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Program Funding</span>
          <h4 className="text-3xl font-black mt-2 text-emerald-455">₱1.8M</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Enrolled Beneficiaries</span>
          <h4 className="text-3xl font-black mt-2 text-white">1,352 Farmers</h4>
        </div>
      </div>

      {/* Table grid layout */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Program Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Budget Scale</th>
                <th className="py-4 px-6">Beneficiary Fill Rate</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {programs.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-850/40 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-zinc-400">{item.id}</td>
                  <td className="py-4 px-6 font-bold text-white">{item.name}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 bg-zinc-850 rounded text-xs text-zinc-300">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-emerald-450 font-bold">{item.budget}</td>
                  <td className="py-4 px-6 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 rounded bg-zinc-950 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 font-bold">
                        {item.enrolled} / {item.capacity} ({item.progress}%)
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "Active"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-450"
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

      {/* Add Program Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl">
            <h4 className="text-lg font-black text-white uppercase tracking-wider mb-4">Launch New Assistance Program</h4>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Program Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hybrid Rice Seeds Support"
                  value={newProg.name}
                  onChange={(e) => setNewProg({ ...newProg, name: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                <select
                  value={newProg.type}
                  onChange={(e) => setNewProg({ ...newProg, type: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                >
                  <option value="Seeds">Seeds</option>
                  <option value="Fertilizer">Fertilizer</option>
                  <option value="Seedlings">Seedlings</option>
                  <option value="Financial Aid">Financial Aid</option>
                  <option value="Implements">Implements</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Budget Allocation (PHP)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 250000"
                  value={newProg.budget}
                  onChange={(e) => setNewProg({ ...newProg, budget: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Beneficiary Capacity</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150"
                  value={newProg.capacity}
                  onChange={(e) => setNewProg({ ...newProg, capacity: e.target.value })}
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
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
