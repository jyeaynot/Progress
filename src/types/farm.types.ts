export interface FarmWeather {
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
}

export interface FarmGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface FarmCropHistoryItem {
  id: string;
  farmerId: string;
  farmerName: string;
  rsbsaId: string;
  barangay: string;
  cropType: string;
  plantingDate: string | null;
  harvestDate: string | null;
  areaHa: number | string;
  status: string;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FarmGISFeature {
  systemId: string;
  farmId: string;
  farmerId: string;
  farmerName: string;
  initials: string;
  contactNumber: string | null;
  barangay: string;
  address: string;
  cropType: string;
  cropIcon: string;
  cropLabel: string;
  variety: string;
  growthStage: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  farmStatus: string;
  totalAreaHa: number;
  polygonAreaHa: number;
  gpsCoordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  dateRegistered: string;
  healthStatus: string;
  ndviValue: number;
  moistureLevel: number;
  pestRisk: string;
  diseaseRisk: string;
  expectedYield: string;
  previousYield: string;
  fertilizerApplied: string;
  lastIrrigation: string | null;
  lastInspection: string | null;
  weather: FarmWeather;
  geometry: FarmGeometry | null;
  cropHistoryCount?: number;
  cropHistory?: FarmCropHistoryItem[];
}

export interface FarmListResponse {
  data: FarmGISFeature[];
}

export interface FarmDetailResponse {
  data: FarmGISFeature;
}

export interface FarmQueryParams {
  search?: string;
  barangay?: string;
  cropType?: string;
  healthStatus?: string;
  growthStage?: string;
  areaSize?: string;
  year?: string;
}
