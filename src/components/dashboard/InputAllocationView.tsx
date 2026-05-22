import { useState } from "react";

export function InputAllocationView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [allocations, setAllocations] = useState([
    { id: "AL-1092", rsbsa: "16-03-09-012", name: "Fermin V. Corvera", crop: "Rice", fertilizer: "2 Bags", seeds: "1 Bag Hybrid", status: "Received", date: "2026-05-10" },
    { id: "AL-1093", rsbsa: "16-03-09-088", name: "Maria L. Santos", crop: "Corn", fertilizer: "1 Bag", seeds: "2 Bags Flint", status: "Received", date: "2026-05-12" },
    { id: "AL-1094", rsbsa: "16-03-09-034", name: "Juan P. Dela Cruz", crop: "Cacao", fertilizer: "3 Bags Organic", seeds: "50 Seedlings", status: "Pending", date: "2026-05-14" },
    { id: "AL-1095", rsbsa: "16-03-09-122", name: "Elena S. Ramos", crop: "Rice", fertilizer: "2 Bags UREA", seeds: "1 Bag Certified", status: "Received", date: "2026-05-15" },
    { id: "AL-1096", rsbsa: "16-03-09-095", name: "Ricardo G. Diaz", crop: "Banana", fertilizer: "1 Bag Potash", seeds: "30 Suckers", status: "Pending", date: "2026-05-18" }
  ]);

  const [newAlloc, setNewAlloc] = useState({
    rsbsa: "",
    name: "",
    crop: "Rice",
    fertilizer: "",
    seeds: "",
    status: "Pending"
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlloc.rsbsa || !newAlloc.name) return;
    const newRecord = {
      id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
      rsbsa: newAlloc.rsbsa,
      name: newAlloc.name,
      crop: newAlloc.crop,
      fertilizer: newAlloc.fertilizer || "None",
      seeds: newAlloc.seeds || "None",
      status: newAlloc.status,
      date: new Date().toISOString().split("T")[0]
    };
    setAllocations([newRecord, ...allocations]);
    setShowAddModal(false);
    setNewAlloc({ rsbsa: "", name: "", crop: "Rice", fertilizer: "", seeds: "", status: "Pending" });
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Upper header action row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-wider text-white">Input Allocations</h3>
          <p className="text-xs text-zinc-400">Manage and track distributed seeds, fertilizer, and agricultural materials.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3 px-6 text-xs font-bold uppercase tracking-wider text-zinc-950 transition-all active:scale-[0.98]"
        >
          + Add Allocation
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Allocated Seed Bags</span>
          <h4 className="text-2xl font-black mt-1 text-white">850 bags</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Fertilizer Voucher Values</span>
          <h4 className="text-2xl font-black mt-1 text-white">₱450,000</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Farmers Reached</span>
          <h4 className="text-2xl font-black mt-1 text-white">920 Farmers</h4>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Awaiting Distribution</span>
          <h4 className="text-2xl font-black mt-1 text-amber-400">148 Pending</h4>
        </div>
      </div>

      {/* Table log */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">RSBSA ID</th>
                <th className="py-4 px-6">Farmer Name</th>
                <th className="py-4 px-6">Crop</th>
                <th className="py-4 px-6">Fertilizer Allocation</th>
                <th className="py-4 px-6">Seeds/Material</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {allocations.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-850/40 transition">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-zinc-400">{item.id}</td>
                  <td className="py-4 px-6 font-mono text-xs text-zinc-300">{item.rsbsa}</td>
                  <td className="py-4 px-6 font-bold text-white">{item.name}</td>
                  <td className="py-4 px-6 text-zinc-300">{item.crop}</td>
                  <td className="py-4 px-6 text-zinc-300">{item.fertilizer}</td>
                  <td className="py-4 px-6 text-zinc-300">{item.seeds}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "Received"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-zinc-400 font-mono text-xs">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl">
            <h4 className="text-lg font-black text-white uppercase tracking-wider mb-4">Record Allocation</h4>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">RSBSA ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 16-03-09-012"
                  value={newAlloc.rsbsa}
                  onChange={(e) => setNewAlloc({ ...newAlloc, rsbsa: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Farmer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria L. Santos"
                  value={newAlloc.name}
                  onChange={(e) => setNewAlloc({ ...newAlloc, name: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Crop</label>
                <select
                  value={newAlloc.crop}
                  onChange={(e) => setNewAlloc({ ...newAlloc, crop: e.target.value })}
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
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Fertilizer Details</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Bags UREA"
                  value={newAlloc.fertilizer}
                  onChange={(e) => setNewAlloc({ ...newAlloc, fertilizer: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Seeds / Support Material</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Bag Hybrid Seeds"
                  value={newAlloc.seeds}
                  onChange={(e) => setNewAlloc({ ...newAlloc, seeds: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                <select
                  value={newAlloc.status}
                  onChange={(e) => setNewAlloc({ ...newAlloc, status: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm outline-none text-white focus:border-emerald-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
