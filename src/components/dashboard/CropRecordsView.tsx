import { useMemo, useState } from "react";
import type { CreateCropRecordInput, CropRecord, FarmerListItem } from "../../types/farmer.types";
import { createCropRecord, updateCropRecord } from "../../services/farmerService";
import { formatEstimateAmount, getCropEstimate } from "../../utils/cropEstimates";

interface CropRecordsViewProps {
  farmers: FarmerListItem[];
  records: CropRecord[];
  onSaved: () => void;
}

const CROP_TYPES = ["Rice", "Corn", "Coconut", "Vegetables", "Banana", "Cacao"] as const;
const RECORD_STATUSES = ["Planned", "Planted", "Growing", "Harvested"] as const;

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function blankForm(farmerId = "", cropType = "Rice"): CreateCropRecordInput & { farmerId: string } {
  return {
    farmerId,
    cropType,
    plantingDate: "",
    harvestDate: "",
    areaHa: "",
    status: "Planted",
    notes: "",
  };
}

export function CropRecordsView({ farmers, records, onSaved }: CropRecordsViewProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CropRecord | null>(null);
  const [formData, setFormData] = useState(blankForm());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleRecords = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) {
      return records;
    }

    return records.filter((record) =>
      [record.farmerName, record.rsbsaId, record.barangay, record.cropType, record.status]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)
    );
  }, [records, search]);

  const summary = useMemo(() => {
    const totalArea = visibleRecords.reduce((sum, record) => sum + Number(record.areaHa || 0), 0);
    const totals = visibleRecords.reduce(
      (acc, record) => {
        const estimate = getCropEstimate(record.cropType, record.areaHa);
        acc.seeds += estimate.seeds;
        acc.fertilizer += estimate.fertilizer;
        return acc;
      },
      { seeds: 0, fertilizer: 0 }
    );

    return {
      totalRecords: visibleRecords.length,
      totalArea,
      totalSeeds: totals.seeds,
      totalFertilizer: totals.fertilizer,
    };
  }, [visibleRecords]);

  function openCreate() {
    const defaultFarmerId = farmers[0]?.id ?? "";
    setEditingRecord(null);
    setFormData(blankForm(defaultFarmerId, farmers[0]?.cropType ?? "Rice"));
    setError(null);
    setShowModal(true);
  }

  function openEdit(record: CropRecord) {
    setEditingRecord(record);
    setFormData({
      farmerId: record.farmerId,
      cropType: record.cropType,
      plantingDate: record.plantingDate ?? "",
      harvestDate: record.harvestDate ?? "",
      areaHa: record.areaHa,
      status: record.status,
      notes: record.notes ?? "",
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.farmerId) {
      setError("Select a farmer for this crop record.");
      return;
    }

    try {
      setIsSaving(true);
      if (editingRecord) {
        await updateCropRecord(editingRecord.id, formData);
      } else {
        await createCropRecord(formData.farmerId, formData);
      }
      onSaved();
      setShowModal(false);
      setEditingRecord(null);
      setFormData(blankForm());
    } catch (submitError: any) {
      setError(submitError.message || "Failed to save crop record.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-wider text-white">Crop Records</h3>
            <p className="max-w-2xl text-sm text-zinc-400">
              Track planting timelines, harvest windows, area coverage, and estimated input requirements per farmer.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crop records..."
              className="min-w-[260px] rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={openCreate}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-950 transition hover:bg-emerald-400"
            >
              + Add Crop Record
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Crop Records</p>
          <p className="mt-2 text-3xl font-black text-white">{summary.totalRecords}</p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Area Covered</p>
          <p className="mt-2 text-3xl font-black text-white">{summary.totalArea.toFixed(2)} <span className="text-base text-zinc-500">ha</span></p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Estimated Seeds</p>
          <p className="mt-2 text-3xl font-black text-emerald-400">{formatEstimateAmount(summary.totalSeeds)}</p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Estimated Fertilizer</p>
          <p className="mt-2 text-3xl font-black text-amber-400">{formatEstimateAmount(summary.totalFertilizer)}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-6">Farmer</th>
                <th className="py-4 px-6">RSBSA</th>
                <th className="py-4 px-6">Crop Type</th>
                <th className="py-4 px-6">Planting Date</th>
                <th className="py-4 px-6">Harvest Date</th>
                <th className="py-4 px-6">Area</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Est. Seeds</th>
                <th className="py-4 px-6">Est. Fertilizer</th>
                <th className="py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {visibleRecords.map((record) => {
                const estimate = getCropEstimate(record.cropType, record.areaHa);
                return (
                  <tr key={record.id} className="hover:bg-zinc-850/40 transition">
                    <td className="py-4 px-6 font-bold text-white">{record.farmerName}</td>
                    <td className="py-4 px-6 font-mono text-xs text-zinc-300">{record.rsbsaId}</td>
                    <td className="py-4 px-6 text-zinc-300">{record.cropType}</td>
                    <td className="py-4 px-6 text-zinc-400">{formatDate(record.plantingDate)}</td>
                    <td className="py-4 px-6 text-zinc-400">{formatDate(record.harvestDate)}</td>
                    <td className="py-4 px-6 text-zinc-300">{record.areaHa} ha</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {record.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-emerald-400 font-semibold">
                      {formatEstimateAmount(estimate.seeds)} {estimate.seedsUnit}
                    </td>
                    <td className="py-4 px-6 text-amber-400 font-semibold">
                      {formatEstimateAmount(estimate.fertilizer)} {estimate.fertilizerUnit}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => openEdit(record)}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-900 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visibleRecords.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center text-zinc-500" colSpan={10}>
                    No crop records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
              <div>
                <h4 className="text-lg font-black uppercase tracking-wider text-white">
                  {editingRecord ? "Edit Crop Record" : "Add Crop Record"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1">Keep planting and harvest timelines current for each farmer.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Farmer</label>
                  <select
                    value={formData.farmerId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, farmerId: e.target.value }))}
                    disabled={Boolean(editingRecord)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-60"
                  >
                    <option value="">Select farmer</option>
                    {farmers.map((farmer) => (
                      <option key={farmer.id} value={farmer.id}>
                        {farmer.fullName} - {farmer.rsbsaId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Crop Type</label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cropType: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    {CROP_TYPES.map((cropType) => (
                      <option key={cropType} value={cropType}>
                        {cropType}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Planting Date</label>
                  <input
                    type="date"
                    value={formData.plantingDate ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plantingDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Harvest Date</label>
                  <input
                    type="date"
                    value={formData.harvestDate ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, harvestDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Area (ha)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.areaHa}
                    onChange={(e) => setFormData((prev) => ({ ...prev, areaHa: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    {RECORD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Notes</label>
                <textarea
                  value={formData.notes ?? ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingRecord ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
