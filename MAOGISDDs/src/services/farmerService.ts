import axios, { AxiosError } from "axios";
import { supabase } from "../lib/supabase";
import type {
  FarmerProfile,
  FarmerProfileResponse,
  FarmerListItem,
  FarmersListResponse,
  CreateFarmerInput,
  UpdateFarmerInput,
  CreateAllocationInput,
  InputAllocation,
} from "../types/farmer.types";

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

function normalizeFarmersListResponse(payload: unknown): FarmersListResponse {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    const response = payload as Partial<FarmersListResponse> & {
      data: FarmerListItem[];
    };
    return {
      data: response.data ?? [],
      meta: {
        page: response.meta?.page ?? 1,
        pageSize: response.meta?.pageSize ?? response.data?.length ?? 10,
        totalPages: response.meta?.totalPages ?? 1,
        filteredCount: response.meta?.filteredCount ?? response.data?.length ?? 0,
        totalRegistered: response.meta?.totalRegistered ?? response.data?.length ?? 0,
      },
    };
  }

  if (Array.isArray(payload)) {
    return {
      data: payload as FarmerListItem[],
      meta: {
        page: 1,
        pageSize: payload.length,
        totalPages: 1,
        filteredCount: payload.length,
        totalRegistered: payload.length,
      },
    };
  }

  return {
    data: [],
    meta: {
      page: 1,
      pageSize: 10,
      totalPages: 1,
      filteredCount: 0,
      totalRegistered: 0,
    },
  };
}

function normalizeFarmerProfileResponse(payload: unknown): FarmerProfile {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as FarmerProfileResponse).data;
  }

  return payload as FarmerProfile;
}

export interface GetFarmersParams {
  search?: string;
  barangay?: string;
  page?: number;
  pageSize?: number;
}

export async function getFarmers(params: GetFarmersParams = {}): Promise<FarmersListResponse> {
  try {
    const response = await api.get("/farmers", {
      params: {
        search: params.search ?? "",
        barangay: params.barangay ?? "",
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });

    return normalizeFarmersListResponse(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to fetch farmers.");
  }
}

export async function getFarmerProfile(id: string): Promise<FarmerProfile> {
  try {
    const response = await api.get(`/farmers/${id}`);
    return normalizeFarmerProfileResponse(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to fetch farmer profile.");
  }
}

export async function exportFarmersCsv(params: Pick<GetFarmersParams, "search" | "barangay"> = {}) {
  try {
    const response = await api.get("/farmers/export", {
      params: {
        search: params.search ?? "",
        barangay: params.barangay ?? "",
      },
      responseType: "blob",
    });

    return response.data as Blob;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to export farmers.");
  }
}

export async function createFarmer(data: CreateFarmerInput): Promise<{ id: string; message: string }> {
  try {
    const response = await api.post("/farmers", data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to create farmer.");
  }
}

export async function updateFarmer(id: string, data: UpdateFarmerInput): Promise<{ message: string }> {
  try {
    const response = await api.put(`/farmers/${id}`, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to update farmer.");
  }
}

export async function deleteFarmer(id: string): Promise<{ message: string }> {
  try {
    const response = await api.delete(`/farmers/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to delete farmer.");
  }
}

export async function createInputAllocation(
  farmerId: string,
  data: CreateAllocationInput
): Promise<{ data: InputAllocation; message: string }> {
  try {
    const response = await api.post(`/farmers/${farmerId}/allocations`, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to record input allocation.");
  }
}
