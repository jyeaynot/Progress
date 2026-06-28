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
    status: "Pending",
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
      status: "Pending",
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
    <div className="ui-modal-overlay flex items-center justify-center">
      <div className="ui-modal-panel w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-6">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.18em] text-white">Add Input Allocation</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Record resources distributed to <strong>{farmerName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="ui-label">
                Fertilizer (e.g. 2 sacks)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.fertilizer || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, fertilizer: e.target.value }))}
                className="ui-input"
              />
            </div>

            <div>
              <label className="ui-label">
                Seeds (e.g. 10 kg certified seeds)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.seeds || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, seeds: e.target.value }))}
                className="ui-input"
              />
            </div>

            <div>
              <label className="ui-label">
                Farm Tools (e.g. 1 hand sprayer)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.farmTools || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmTools: e.target.value }))}
                className="ui-input"
              />
            </div>

            <div>
              <label className="ui-label">
                Pesticides (e.g. 2 bottles)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.pesticides || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, pesticides: e.target.value }))}
                className="ui-input"
              />
            </div>

            <div>
              <label className="ui-label">
                Irrigation Subsidy (e.g. PHP 1,500)
              </label>
              <input
                type="text"
                placeholder="None"
                value={formData.irrigationSubsidy || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, irrigationSubsidy: e.target.value }))}
                className="ui-input"
              />
            </div>

            <div>
              <label className="ui-label">
                Status
              </label>
              <select
                value={formData.status || "Pending"}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "Pending" | "Received" }))}
                className="ui-select"
              >
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </select>
            </div>

            <div>
              <label className="ui-label">
                Notes
              </label>
              <textarea
                placeholder="Additional details..."
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="ui-textarea"
              />
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.03] p-6">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={isLoading}
            className="ui-btn-primary"
          >
            {isLoading ? "Recording..." : "Record Allocation"}
          </button>
        </div>
      </div>
    </div>
  );
}
