import { useEffect, useState } from "react";
import type { VehicleFilters, VehicleWithListing } from "../types/vehicle";
import { fetchVehicles } from "../services/vehiclesApi";

interface UseVehiclesResult {
  vehicles: VehicleWithListing[];
  loading: boolean;
  error: string | null;
}

export function useVehicles(filters: VehicleFilters): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<VehicleWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVehicles(filters)
      .then((data) => {
        if (!cancelled) setVehicles(data);
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
  }, [filters.make, filters.priceMin, filters.priceMax, filters.mileageMax]);

  return { vehicles, loading, error };
}
