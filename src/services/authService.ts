import axios, { AxiosError } from "axios";
import { supabase } from "../lib/supabase";
import type { CurrentUserResponse } from "../types/auth.types";

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

export async function getCurrentUser() {
  try {
    const response = await api.get<CurrentUserResponse>("/auth/me");
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to fetch current user.");
  }
}

export interface CreateStaffProfileInput {
  fullName: string;
  role: string;
  office: string;
}

export async function createStaffProfile(
  payload: CreateStaffProfileInput,
  accessToken: string
) {
  try {
    const response = await api.post(
      "/auth/me",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    throw new Error(axiosError.response?.data?.message ?? "Failed to create staff profile.");
  }
}
