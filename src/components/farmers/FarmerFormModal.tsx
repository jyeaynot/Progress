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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {farmer ? `Edit Profile: ${farmer.fullName}` : "Register New Farmer"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {farmer ? "Modify existing crop fields and demographics" : "Complete RSBSA details & coordinate mapping"}
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
        <form onSubmit={handleFormSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                RSBSA & Demographics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    RSBSA ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RSBSA-2026-0000"
                    value={formData.rsbsaId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rsbsaId: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Barangay *
                  </label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, barangay: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
                  >
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="09XXXXXXXXX"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Civil Status
                  </label>
                  <select
                    value={formData.civilStatus}
                    onChange={(e) => setFormData((prev) => ({ ...prev, civilStatus: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
                  >
                    {CIVIL_STATUSES.map((cs) => (
                      <option key={cs} value={cs}>
                        {cs}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Ethnicity
                  </label>
                  <input
                    type="text"
                    placeholder="Manobo / Higaonon etc."
                    value={formData.ethnicity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ethnicity: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Crop Info & GIS Map */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Crop & GIS Location mapping
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Crop Type *
                  </label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cropType: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
                  >
                    {CROP_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Season *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Wet Season 2026"
                    value={formData.season}
                    onChange={(e) => setFormData((prev) => ({ ...prev, season: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white outline-none focus:border-emerald-500"
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
            {isLoading ? "Saving..." : farmer ? "Save Changes" : "Register Farmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
