import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFarmerProfile, useFarmers } from "../hooks/useFarmers";
import { FarmerList } from "../components/farmers/FarmerList";
import { FarmerProfile } from "../components/farmers/FarmerProfile";
import { exportFarmersCsv, createFarmer, updateFarmer, deleteFarmer, createInputAllocation } from "../services/farmerService";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { FarmerFormModal } from "../components/farmers/FarmerFormModal";
import { AllocationFormModal } from "../components/farmers/AllocationFormModal";
import type { CreateFarmerInput, CreateAllocationInput, FarmerProfile as FarmerProfileType } from "../types/farmer.types";

// Import custom subviews
import { DashboardView } from "../components/dashboard/DashboardView";
import { GisMapView } from "../components/dashboard/GisMapView";
import { InputAllocationView } from "../components/dashboard/InputAllocationView";
import { HarvestRecordsView } from "../components/dashboard/HarvestRecordsView";
import { CalamityDamageView } from "../components/dashboard/CalamityDamageView";
import { CropHealthView } from "../components/dashboard/CropHealthView";
import { ProgramsView } from "../components/dashboard/ProgramsView";
import { ReportsView } from "../components/dashboard/ReportsView";

export default function FarmersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const currentUser = useCurrentUser();

  // Active Tab state matching the 9 Sidebar items from Figma
  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "gisMap" | "cropRecords" | "inputAllocation" | "harvestRecords" | "calamityDamage" | "cropHealth" | "programsBenefits" | "reports"
  >("dashboard");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<FarmerProfileType | null>(null);
  
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const [allocationTarget, setAllocationTarget] = useState<{ id: string; name: string } | null>(null);

  const [formSaving, setFormSaving] = useState(false);
  const [allocationSaving, setAllocationSaving] = useState(false);

  const farmersQuery = useFarmers({
    search,
    page,
  });

  const selectedFarmer = useFarmerProfile(selectedFarmerId);
  const farmers = farmersQuery.data?.data ?? [];
  const meta = farmersQuery.data?.meta;

  const totalRegistered = meta?.totalRegistered ?? farmers.length;
  const titleCount = useMemo(
    () => new Intl.NumberFormat("en-US").format(totalRegistered),
    [totalRegistered]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (farmers.length === 0) {
      setSelectedFarmerId(null);
      return;
    }

    const stillVisible = selectedFarmerId
      ? farmers.some((farmer) => farmer.id === selectedFarmerId)
      : false;

    if (!stillVisible) {
      setSelectedFarmerId(farmers[0].id);
    }
  }, [farmers, selectedFarmerId]);

  const farmerError = farmersQuery.error instanceof Error ? farmersQuery.error.message : null;
  const profileError = selectedFarmer.error instanceof Error ? selectedFarmer.error.message : null;

  async function handleExport() {
    try {
      const blob = await exportFarmersCsv({ search });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "farmers-export.csv";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  async function handleCreateOrUpdateFarmerSubmit(data: CreateFarmerInput) {
    setFormSaving(true);
    try {
      if (editingFarmer) {
        await updateFarmer(editingFarmer.id, data);
      } else {
        await createFarmer(data);
      }
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      if (editingFarmer) {
        queryClient.invalidateQueries({ queryKey: ["farmer-profile", editingFarmer.id] });
      }
      setIsFormOpen(false);
      setEditingFarmer(null);
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDeleteFarmer(id: string) {
    if (!window.confirm("Are you sure you want to delete this farmer and all associated input allocations? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteFarmer(id);
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      setSelectedFarmerId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete farmer.");
    }
  }

  async function handleCreateAllocationSubmit(data: CreateAllocationInput) {
    if (!allocationTarget) return;
    setAllocationSaving(true);
    try {
      await createInputAllocation(allocationTarget.id, data);
      queryClient.invalidateQueries({ queryKey: ["farmer-profile", allocationTarget.id] });
      setIsAllocationOpen(false);
      setAllocationTarget(null);
    } finally {
      setAllocationSaving(false);
    }
  }

  // Sidebar navigation options configuration
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "gisMap", label: "GIS Map", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
    { id: "cropRecords", label: "Crop Records", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
    { id: "inputAllocation", label: "Input Allocation", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { id: "harvestRecords", label: "Harvest Records", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "calamityDamage", label: "Calamity & Damage", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    { id: "cropHealth", label: "Crop Health Monitor", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { id: "programsBenefits", label: "Programs & Benefits", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: "reports", label: "Reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }
  ] as const;

  // Active Title
  const activeTitle = useMemo(() => {
    return sidebarItems.find(item => item.id === currentTab)?.label ?? "Dashboard";
  }, [currentTab]);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* LEFT SIDEBAR - Forest Green Theme matching Figma */}
      <aside className="w-80 bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-900 border-r border-emerald-800/40 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-emerald-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase text-white tracking-wider leading-none">
                MAO GIS-Crop System
              </h1>
              <p className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase mt-1">
                Talacogon, Agusan del Sur
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                      : "text-emerald-100/75 hover:bg-emerald-800/30 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Profile & Timeout */}
        <div className="pt-6 border-t border-emerald-800/40 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800/90 border border-emerald-500/30 flex items-center justify-center font-black text-xs text-white">
              MA
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">M. Antonio</p>
              <p className="text-[10px] text-emerald-350 font-semibold mt-0.5 uppercase">Admin / MAO Manager</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-3.5 bg-emerald-850 hover:bg-emerald-800/40 text-emerald-250 hover:text-white border border-emerald-800/30 rounded-2xl text-xs font-bold uppercase tracking-wider transition"
          >
            Timeout / Sign out
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA - Dark Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <header className="h-20 border-b border-zinc-900 px-6 md:px-8 flex items-center justify-between bg-zinc-950 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black uppercase tracking-widest text-white">
              {activeTitle}
            </h2>
            {currentTab === "cropRecords" && (
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-wider">
                {titleCount} Directory Entries
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentTab === "cropRecords" && (
              <>
                <button
                  onClick={() => {
                    setEditingFarmer(null);
                    setIsFormOpen(true);
                  }}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 transition"
                >
                  + Add Farmer
                </button>
                <button
                  onClick={handleExport}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-850 transition"
                >
                  Export CSV
                </button>
              </>
            )}
            <span className="text-xs text-zinc-500 font-bold font-mono uppercase tracking-wider bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-850">
              Session Active
            </span>
          </div>
        </header>

        {/* DYNAMIC SUBVIEW CONTAINER */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-zinc-950">
          <div className="mx-auto max-w-7xl">
            {currentTab === "dashboard" && (
              <DashboardView farmers={farmers} />
            )}

            {currentTab === "gisMap" && (
              <GisMapView
                farmers={farmers}
                onSelectFarmer={setSelectedFarmerId}
                onViewProfile={() => setCurrentTab("cropRecords")}
              />
            )}

            {currentTab === "cropRecords" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="min-h-[560px]">
                  <FarmerList
                    farmers={farmers}
                    selectedFarmerId={selectedFarmerId}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onSelectFarmer={setSelectedFarmerId}
                    isLoading={farmersQuery.isLoading}
                    isFetching={farmersQuery.isFetching}
                    error={farmerError}
                    page={meta?.page ?? page}
                    totalPages={meta?.totalPages ?? 1}
                    onPageChange={setPage}
                  />
                </div>

                <section className="min-h-[560px]">
                  <FarmerProfile
                    farmer={selectedFarmer.data ?? null}
                    isLoading={selectedFarmer.isLoading}
                    error={profileError}
                    onEditClick={(farmerToEdit) => {
                      setEditingFarmer(farmerToEdit);
                      setIsFormOpen(true);
                    }}
                    onDeleteClick={handleDeleteFarmer}
                    onAddAllocationClick={(id, name) => {
                      setAllocationTarget({ id, name });
                      setIsAllocationOpen(true);
                    }}
                  />
                </section>
              </div>
            )}

            {currentTab === "inputAllocation" && (
              <InputAllocationView />
            )}

            {currentTab === "harvestRecords" && (
              <HarvestRecordsView />
            )}

            {currentTab === "calamityDamage" && (
              <CalamityDamageView />
            )}

            {currentTab === "cropHealth" && (
              <CropHealthView />
            )}

            {currentTab === "programsBenefits" && (
              <ProgramsView />
            )}

            {currentTab === "reports" && (
              <ReportsView />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <FarmerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingFarmer(null);
        }}
        farmer={editingFarmer}
        onSubmit={handleCreateOrUpdateFarmerSubmit}
        isLoading={formSaving}
      />

      {allocationTarget && (
        <AllocationFormModal
          isOpen={isAllocationOpen}
          onClose={() => {
            setIsAllocationOpen(false);
            setAllocationTarget(null);
          }}
          farmerId={allocationTarget.id}
          farmerName={allocationTarget.name}
          onSubmit={handleCreateAllocationSubmit}
          isLoading={allocationSaving}
        />
      )}
    </div>
  );
}
