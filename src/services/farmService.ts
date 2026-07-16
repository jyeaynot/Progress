import axios, { AxiosError } from "axios";
import { supabase } from "../lib/supabase";
import type {
  FarmDetailResponse,
  FarmGISFeature,
  FarmListResponse,
  FarmQueryParams,
} from "../types/farm.types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

function normalizeFarmListResponse(payload: unknown): FarmGISFeature[] {
  if (payload && typeof payload === "object" && "data" in payload) {
    const response = payload as Partial<FarmListResponse> & { data: FarmGISFeature[] };
    return response.data ?? [];
  }

  if (Array.isArray(payload)) {
    return payload as FarmGISFeature[];
  }

  return [];
}

function normalizeFarmDetailResponse(payload: unknown): FarmGISFeature {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as FarmDetailResponse).data;
  }

  return payload as FarmGISFeature;
}

export async function getFarms(params: FarmQueryParams = {}): Promise<FarmGISFeature[]> {
  try {
    const response = await api.get("/farms", { params });
    return normalizeFarmListResponse(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to load GIS farms.");
  }
}

export async function searchFarms(params: FarmQueryParams = {}): Promise<FarmGISFeature[]> {
  try {
    const response = await api.get("/farms/search", { params });
    return normalizeFarmListResponse(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to search GIS farms.");
  }
}

export async function filterFarms(params: FarmQueryParams = {}): Promise<FarmGISFeature[]> {
  try {
    const response = await api.get("/farms/filter", { params });
    return normalizeFarmListResponse(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to filter GIS farms.");
  }
}

export async function getFarmById(id: string): Promise<FarmGISFeature> {
  try {
    const response = await api.get(`/farms/${id}`);
    return normalizeFarmDetailResponse(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to load farm details.");
  }
}
