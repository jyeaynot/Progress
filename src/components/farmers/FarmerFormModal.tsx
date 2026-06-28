import { useEffect, useState } from "react";
import type { CreateFarmerInput, FarmerProfile } from "../../types/farmer.types";
import { MapSelector } from "./MapSelector";

interface FarmerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerProfile | null;
  onSubmit: (data: CreateFarmerInput) => Promise<void>;
  isLoading: boolean;
}

const BARANGAYS = [
  "Poblacion",
  "Sto. Nino",
  "Buhisan",
  "San Isidro",
  "San Jose",
  "San Vicente",
  "Del Monte",
  "La Flora",
];

const CROP_TYPES = ["Rice", "Corn", "Coconut", "Vegetables", "Banana", "Cacao"];
const CIVIL_STATUSES = ["Single", "Married", "Widowed", "Separated"];

export function FarmerFormModal({ isOpen, onClose, farmer, onSubmit, isLoading }: FarmerFormModalProps) {
  const [formData, setFormData] = useState<CreateFarmerInput>({
    rsbsaId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    barangay: "Poblacion",
    contactNumber: "",
    civilStatus: "Single",
    ethnicity: "",
    birthDate: "",
    cropType: "Rice",
    season: "Wet Season 2026",
    latitude: 8.1297,
    longitude: 125.3962,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (farmer) {
      // Map to form data
      setFormData({
        rsbsaId: farmer.rsbsaId,
        firstName: farmer.fullName.split(" ")[0] || "",
        middleName: farmer.fullName.split(" ").length > 2 ? farmer.fullName.split(" ")[1] : "",
        lastName: farmer.fullName.split(" ").pop() || "",
        barangay: farmer.barangay,
        contactNumber: farmer.contactNumber || "",
        civilStatus: farmer.civilStatus || "Single",
        ethnicity: farmer.ethnicity || "",
        birthDate: farmer.birthDate ? farmer.birthDate.substring(0, 10) : "",
        cropType: farmer.cropType,
        season: farmer.season,
        latitude: farmer.gisLocation?.latitude ?? 8.1297,
        longitude: farmer.gisLocation?.longitude ?? 125.3962,
      });
    } else {
      // Reset to defaults
      setFormData({
        rsbsaId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        barangay: "Poblacion",
        contactNumber: "",
        civilStatus: "Single",
        ethnicity: "",
        birthDate: "",
        cropType: "Rice",
        season: "Wet Season 2026",
        latitude: 8.1297,
        longitude: 125.3962,
      });
    }
    setError(null);
  }, [farmer, isOpen]);

  if (!isOpen) return null;

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.rsbsaId.trim()) return setError("RSBSA ID is required.");
    if (!formData.firstName.trim()) return setError("First Name is required.");
    if (!formData.lastName.trim()) return setError("Last Name is required.");
    if (!formData.barangay) return setError("Barangay is required.");
    if (!formData.cropType) return setError("Crop Type is required.");
    if (!formData.season.trim()) return setError("Season is required.");

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save farmer profile.");
    }
  }

  function handleCoordsChange(coords: { latitude: number; longitude: number }) {
    setFormData((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
  }

  return (
    <div className="ui-modal-overlay overflow-y-auto">
      <div className="ui-modal-panel flex max-h-[90vh] w-full max-w-5xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent p-6">
          <div>
            <h2 className="text-xl font-black tracking-[0.18em] text-white uppercase">
              {farmer ? `Edit Profile: ${farmer.fullName}` : "Register New Farmer"}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {farmer ? "Modify existing crop fields and demographics" : "Complete RSBSA details & coordinate mapping"}
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
        <form onSubmit={handleFormSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Column: Details */}
            <div className="space-y-4">
              <h3 className="border-b border-white/10 pb-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                RSBSA & Demographics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="ui-label">
                    RSBSA ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RSBSA-2026-0000"
                    value={formData.rsbsaId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rsbsaId: e.target.value }))}
                    className="ui-input"
                  />
                </div>

                <div>
                  <label className="ui-label">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="ui-input"
                  />
                </div>

                <div>
                  <label className="ui-label">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="ui-input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="ui-label">
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="ui-label">
                    Barangay *
                  </label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, barangay: e.target.value }))}
                    className="ui-select"
                  >
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ui-label">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="09XXXXXXXXX"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                    className="ui-input"
                  />
                </div>

                <div>
                  <label className="ui-label">
                    Civil Status
                  </label>
                  <select
                    value={formData.civilStatus}
                    onChange={(e) => setFormData((prev) => ({ ...prev, civilStatus: e.target.value }))}
                    className="ui-select"
                  >
                    {CIVIL_STATUSES.map((cs) => (
                      <option key={cs} value={cs}>
                        {cs}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ui-label">
                    Ethnicity
                  </label>
                  <input
                    type="text"
                    placeholder="Manobo / Higaonon etc."
                    value={formData.ethnicity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ethnicity: e.target.value }))}
                    className="ui-input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="ui-label">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                    className="ui-input"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Crop Info & GIS Map */}
            <div className="space-y-4">
              <h3 className="border-b border-white/10 pb-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                Crop & GIS Location mapping
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="ui-label">
                    Crop Type *
                  </label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cropType: e.target.value }))}
                    className="ui-select"
                  >
                    {CROP_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ui-label">
                    Season *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Wet Season 2026"
                    value={formData.season}
                    onChange={(e) => setFormData((prev) => ({ ...prev, season: e.target.value }))}
                    className="ui-input"
                  />
                </div>
              </div>

              {/* Map coordinates picker */}
              <MapSelector
                latitude={formData.latitude ?? null}
                longitude={formData.longitude ?? null}
                onChange={handleCoordsChange}
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
            {isLoading ? "Saving..." : farmer ? "Save Changes" : "Register Farmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
