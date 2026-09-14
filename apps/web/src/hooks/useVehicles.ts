import { useEffect, useState } from "react";
import type { VehicleFilters, VehicleSort, VehicleWithListing } from "../types/vehicle";
import { fetchVehicles } from "../services/vehiclesApi";

const PAGE_SIZE = 25;

interface UseVehiclesResult {
  vehicles: VehicleWithListing[];
  total: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  loading: boolean;
  error: string | null;
}

// Resets to page 0 whenever filters or sort change — a stale page number
// from a previous, larger result set would otherwise silently return an
// empty page instead of the results the user just asked for.
export function useVehicles(filters: VehicleFilters, sort: VehicleSort): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<VehicleWithListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [filters.make, filters.model, filters.priceMin, filters.priceMax, filters.mileageMax, filters.yearMin, filters.yearMax, sort.sortBy, sort.sortDir]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVehicles(filters, sort, page, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setVehicles(data.items);
        setTotal(data.total);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.make,
    filters.model,
    filters.priceMin,
    filters.priceMax,
    filters.mileageMax,
    filters.yearMin,
    filters.yearMax,
    sort.sortBy,
    sort.sortDir,
    page,
  ]);

  return { vehicles, total, page, pageSize: PAGE_SIZE, setPage, loading, error };
}
