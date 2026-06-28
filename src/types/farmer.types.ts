export interface FarmerListItem {
  id: string;
  rsbsaId: string;
  fullName: string;
  initials: string;
  barangay: string;
  cropType: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface GisLocation {
  latitude: number | null;
  longitude: number | null;
  label?: string | null;
  geoJson?: {
    type: "Point";
    coordinates: [number, number];
  } | null;
}

export interface InputAllocation {
  id: string;
  fertilizer: string | number | null;
  seeds: string | number | null;
  farmTools: string | number | null;
  pesticides: string | number | null;
  irrigationSubsidy: string | number | null;
  status: "Pending" | "Received" | string;
  allocatedAt?: string | null;
  notes?: string | null;
}

export interface CropRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  rsbsaId: string;
  barangay: string;
  cropType: string;
  plantingDate: string | null;
  harvestDate: string | null;
  areaHa: number | string;
  status: "Planned" | "Planted" | "Growing" | "Harvested" | string;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FarmerProfile extends FarmerListItem {
  contactNumber: string;
  civilStatus: string;
  ethnicity: string;
  age: number | null;
  season: string;
  birthDate?: string | null;
  farmDetails: {
    cropType: string;
    season: string;
  };
  inputAllocations: InputAllocation[];
  cropRecords: CropRecord[];
  gisLocation: GisLocation;
}

export interface FarmersMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  filteredCount: number;
  totalRegistered: number;
}

export interface FarmersListResponse {
  data: FarmerListItem[];
  meta: FarmersMeta;
}

export interface FarmerProfileResponse {
  data: FarmerProfile;
}

export interface CreateFarmerInput {
  rsbsaId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  barangay: string;
  contactNumber?: string;
  civilStatus?: string;
  ethnicity?: string;
  birthDate?: string;
  cropType: string;
  season: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateFarmerInput extends CreateFarmerInput {}

export interface CreateAllocationInput {
  fertilizer?: string | null;
  seeds?: string | null;
  farmTools?: string | null;
  pesticides?: string | null;
  irrigationSubsidy?: string | null;
  status?: "Pending" | "Received" | string;
  notes?: string | null;
}

export interface CreateCropRecordInput {
  cropType: string;
  plantingDate?: string | null;
  harvestDate?: string | null;
  areaHa: number | string;
  status?: "Planned" | "Planted" | "Growing" | "Harvested" | string;
  notes?: string | null;
}

export interface UpdateCropRecordInput extends CreateCropRecordInput {}
