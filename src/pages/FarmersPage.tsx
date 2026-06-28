import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCropRecords, useFarmerProfile, useFarmers } from "../hooks/useFarmers";
import { FarmerList } from "../components/farmers/FarmerList";
import { FarmerProfile } from "../components/farmers/FarmerProfile";
import {
  exportFarmersCsv,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  createInputAllocation,
  updateInputAllocationStatus,
} from "../services/farmerService";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { FarmerFormModal } from "../components/farmers/FarmerFormModal";
import { AllocationFormModal } from "../components/farmers/AllocationFormModal";
import type { CreateFarmerInput, CreateAllocationInput, FarmerProfile as FarmerProfileType } from "../types/farmer.types";

// Import custom subviews
import { DashboardView } from "../components/dashboard/DashboardView";
import { GisMapView } from "../components/dashboard/GisMapView";
import { CropRecordsView } from "../components/dashboard/CropRecordsView";
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

  // Active Tab state matching the 10 Sidebar items from Figma (added "farmers")
  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "gisMap" | "cropRecords" | "farmers" | "inputAllocation" | "harvestRecords" | "calamityDamage" | "cropHealth" | "programsBenefits" | "reports"
  >("dashboard");

  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<FarmerProfileType | null>(null);
  
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const [allocationTarget, setAllocationTarget] = useState<{ id: string; name: string } | null>(null);

  const [formSaving, setFormSaving] = useState(false);
  const [allocationSaving, setAllocationSaving] = useState(false);

  const farmersQuery = useFarmers({
    search,
    cropType: cropFilter,
    page,
  });
  const cropRecordsQuery = useCropRecords();

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
  }, [search, cropFilter]);

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
      const blob = await exportFarmersCsv({ search, cropType: cropFilter });
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
      queryClient.invalidateQueries({ queryKey: ["crop-records"] });
      setIsAllocationOpen(false);
      setAllocationTarget(null);
    } finally {
      setAllocationSaving(false);
    }
  }

  async function handleAllocationStatusChange(farmerId: string, allocationId: string, status: "Pending" | "Received") {
    try {
      await updateInputAllocationStatus(farmerId, allocationId, status);
      queryClient.invalidateQueries({ queryKey: ["farmer-profile", farmerId] });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update allocation status.");
    }
  }

  // Sidebar navigation options grouped by sections matching Figma
  const sidebarGroups = [
    {
      title: "MAIN",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
        { id: "gisMap", label: "GIS Map", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
      ]
    },
    {
      title: "CROP MANAGEMENT",
      items: [
        { id: "cropRecords", label: "Crop Records", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
        { id: "farmers", label: "Farmers", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0zm0 0a3 3 0 11-6 0 3 3 0 016 0z" },
        { id: "inputAllocation", label: "Input Allocation", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
        { id: "harvestRecords", label: "Harvest Records", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      ]
    },
    {
      title: "MONITORING",
      items: [
        { id: "calamityDamage", label: "Calamity & Damage", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
        { id: "cropHealth", label: "Crop Health Monitor", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        { id: "programsBenefits", label: "Programs & Benefits", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { id: "reports", label: "Reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }
      ]
    }
  ] as const;

  // Active Title
  const activeTitle = useMemo(() => {
    for (const group of sidebarGroups) {
      const item = group.items.find(item => item.id === currentTab);
      if (item) return item.label;
    }
    return "Dashboard";
  }, [currentTab]);

  return (
    <div className="flex min-h-screen bg-transparent text-zinc-100">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-sm md:hidden"
        />
      ) : null}
      
      {/* LEFT SIDEBAR - Forest Green Theme matching Figma */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-[#0A5C22] border-r border-white/10 shadow-2xl transition-transform duration-300 md:static md:z-0 md:flex md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } flex-col justify-between py-5 px-0`}
      >
        <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
          
          {/* Logo & Header */}
          <div className="flex items-start gap-3 px-5 flex-shrink-0">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-bold text-white leading-snug">
                GIS-Based Crop Management Information System
              </h1>
              <p className="mt-1 text-[10px] font-bold text-[#00FF66]">
                MAO Talacogon
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-2xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/20 md:hidden"
            >
              Close
            </button>
          </div>

          <div className="border-b border-white/20 w-full" />

          {/* Navigation Links - Grouped with Category Titles and Dividers */}
          <nav className="space-y-4 flex-1 overflow-y-auto pr-0 min-h-0">
            {sidebarGroups.map((group, groupIdx) => (
              <div key={group.title} className="space-y-2">
                {groupIdx > 0 && <div className="border-t border-white/20 w-full mb-3" />}
                <h4 className="px-5 text-[9px] font-bold tracking-[0.18em] text-white/50 uppercase">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`flex w-full items-center justify-between py-3 px-5 text-left text-xs font-semibold text-white transition-all hover:bg-white/10 relative ${
                          isActive ? "bg-white/15" : ""
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          <span className="tracking-wide">{item.label}</span>
                        </span>

                        {item.id === "farmers" && (
                          <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[9px] font-bold text-white">
                            {titleCount}
                          </span>
                        )}

                        {item.id === "calamityDamage" && (
                          <span className="inline-flex items-center rounded-full bg-[#eb3c3c] px-2.5 py-0.5 text-[9px] font-bold text-white">
                            2
                          </span>
                        )}

                        {isActive && (
                          <span className="absolute right-0 top-0 bottom-0 w-[5px] bg-[#00FF66] shadow-[0_0_8px_#00ff66]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer - Profile & Timeout */}
        <div className="space-y-4 flex-shrink-0 pt-4">
          <div className="border-t border-white/20 w-full mb-4" />
          <div className="px-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#083A16] border border-white/10 font-black text-xs text-white">
                MA
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">M. Antonio</p>
                <p className="text-[10px] text-white/70 font-semibold mt-1 uppercase">Admin . MAO Talacogon</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 border border-white/15 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-xs font-semibold transition"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
              </svg>
              Time out
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA - Dark Canvas */}
      <div className="flex min-w-0 flex-1 flex-col">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="ui-btn-secondary md:hidden px-3 py-2"
              aria-label="Open navigation"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.22em] text-white md:text-xl leading-none">
                {activeTitle}
              </h2>
              {currentTab === "farmers" ? (
                <p className="mt-1.5 text-xs text-zinc-400 font-semibold tracking-wider">
                  {titleCount} Registered • MAO Talacogon
                </p>
              ) : currentTab === "cropRecords" ? (
                <span className="mt-1.5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                  {titleCount} Directory Entries
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {currentTab === "farmers" && (
              <>
                <button
                  onClick={handleExport}
                  className="ui-btn-secondary px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                >
                  Export
                </button>
                <button
                  onClick={() => {
                    setEditingFarmer(null);
                    setIsFormOpen(true);
                  }}
                  className="ui-btn-primary px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                >
                  + Add Farmer
                </button>
              </>
            )}
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
              Session Active
            </span>
          </div>
        </header>

        {/* DYNAMIC SUBVIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[96rem] space-y-6">
            {currentTab === "dashboard" && (
              <DashboardView farmers={farmers} />
            )}

            {currentTab === "gisMap" && (
              <GisMapView
                farmers={farmers}
                onSelectFarmer={setSelectedFarmerId}
                onViewProfile={() => setCurrentTab("farmers")}
              />
            )}

            {currentTab === "cropRecords" && (
              <div className="space-y-8">
                <CropRecordsView
                  farmers={farmers}
                  records={cropRecordsQuery.data ?? []}
                  onSaved={() => {
                    queryClient.invalidateQueries({ queryKey: ["crop-records"] });
                    queryClient.invalidateQueries({ queryKey: ["farmer-profile"] });
                  }}
                />
              </div>
            )}

            {currentTab === "farmers" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
                <div className="min-h-[600px] flex flex-col">
                  <FarmerList
                    farmers={farmers}
                    selectedFarmerId={selectedFarmerId}
                    searchValue={search}
                    onSearchChange={setSearch}
                    selectedCropType={cropFilter}
                    onCropTypeChange={setCropFilter}
                    onSelectFarmer={setSelectedFarmerId}
                    isLoading={farmersQuery.isLoading}
                    isFetching={farmersQuery.isFetching}
                    error={farmerError}
                    page={meta?.page ?? page}
                    totalPages={meta?.totalPages ?? 1}
                    onPageChange={setPage}
                  />
                </div>

                <section className="min-h-[600px]">
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
                    onAllocationStatusChange={handleAllocationStatusChange}
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
