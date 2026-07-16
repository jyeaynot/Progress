import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCropRecords, getFarmerProfile, getFarmers } from "../services/farmerService";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

export interface UseFarmersParams {
  search?: string;
  barangay?: string;
  cropType?: string;
  page?: number;
  pageSize?: number;
}

export function useFarmers(params: UseFarmersParams) {
  const debouncedSearch = useDebouncedValue(params.search ?? "", 300);

  return useQuery({
    queryKey: ["farmers", debouncedSearch, params.barangay ?? "", params.cropType ?? "", params.page ?? 1, params.pageSize ?? 10],
    queryFn: () =>
      getFarmers({
        search: debouncedSearch,
        barangay: params.barangay,
        cropType: params.cropType,
        page: params.page,
        pageSize: params.pageSize,
      }),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useFarmerProfile(id?: string | null) {
  return useQuery({
    queryKey: ["farmer-profile", id],
    queryFn: () => getFarmerProfile(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCropRecords(search = "") {
  const debouncedSearch = useDebouncedValue(search, 300);

  return useQuery({
    queryKey: ["crop-records", debouncedSearch],
    queryFn: () => getCropRecords(debouncedSearch),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}
