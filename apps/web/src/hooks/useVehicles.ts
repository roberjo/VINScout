import { useEffect, useState } from "react";
import type { Vehicle } from "@vinscout/domain";
import { fetchVehicles } from "../services/vehiclesApi";

interface UseVehiclesResult {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}

export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchVehicles()
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
  }, []);

  return { vehicles, loading, error };
}
