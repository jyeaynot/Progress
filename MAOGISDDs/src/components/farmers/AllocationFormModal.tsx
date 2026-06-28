import { useEffect, useState } from "react";
import type { CreateAllocationInput } from "../../types/farmer.types";

interface AllocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId: string;
  farmerName: string;
  onSubmit: (data: CreateAllocationInput) => Promise<void>;
  isLoading: boolean;
}

export function AllocationFormModal({
  isOpen,
  onClose,
  farmerId,
  farmerName,
  onSubmit,
  isLoading,
}: AllocationFormModalProps) {
  const [formData, setFormData] = useState<CreateAllocationInput>({
    fertilizer: "",
    seeds: "",
    farmTools: "",
    pesticides: "",
    irrigationSubsidy: "",
    notes: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      fertilizer: "",
      seeds: "",
      farmTools: "",
      pesticides: "",
      irrigationSubsidy: "",
      notes: "",
    });
    setError(null);
  }, [isOpen, farmerId]);

  if (!isOpen) return null;

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate at least one allocation is set
    const hasAnyField = Object.values(formData).some((value) => value && value.trim().length > 0);
    if (!hasAnyField) {
      setError("Please fill out at least one allocation field or note.");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record input allocation.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Input Allocation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Record resources distributed to <strong>{farmerName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Fertilizer (e.g. 2 sacks)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.fertilizer || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, fertilizer: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Seeds (e.g. 10 kg certified seeds)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.seeds || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, seeds: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Farm Tools (e.g. 1 hand sprayer)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.farmTools || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmTools: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Pesticides (e.g. 2 bottles)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.pesticides || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, pesticides: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Irrigation Subsidy (e.g. PHP 1,500)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.irrigationSubsidy || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, irrigationSubsidy: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Notes
              </label>
              <textarea
                placeholder="Additional details..."
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={isLoading}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Recording..." : "Record Allocation"}
          </button>
        </div>
      </div>
    </div>
  );
}
