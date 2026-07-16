import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { filterFarms, getFarmById, getFarms, searchFarms } from "../services/farmService";
import type { FarmGISFeature, FarmQueryParams } from "../types/farm.types";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

export function useFarms(params: FarmQueryParams = {}) {
  const debouncedSearch = useDebouncedValue(params.search ?? "", 280);

  return useQuery({
    queryKey: [
      "farms",
      debouncedSearch,
      params.barangay ?? "",
      params.cropType ?? "",
      params.healthStatus ?? "",
      params.growthStage ?? "",
      params.areaSize ?? "",
      params.year ?? "",
    ],
    queryFn: async () => {
      const filters = {
        ...params,
        search: debouncedSearch,
      };

      if (
        filters.search ||
        filters.barangay ||
        filters.cropType ||
        filters.healthStatus ||
        filters.growthStage ||
        filters.areaSize ||
        filters.year
      ) {
        const filtered = await filterFarms(filters);
        return filtered;
      }

      return getFarms(filters);
    },
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useFarmDetails(id?: string | null) {
  return useQuery({
    queryKey: ["farm-details", id],
    queryFn: () => getFarmById(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useFarmSearchResults(params: FarmQueryParams = {}) {
  return useQuery({
    queryKey: ["farm-search", params.search ?? "", params.barangay ?? "", params.cropType ?? ""],
    queryFn: () => searchFarms(params),
    staleTime: 20_000,
  });
}

export type { FarmGISFeature };
