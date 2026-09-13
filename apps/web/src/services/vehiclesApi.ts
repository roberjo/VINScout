import type { Vehicle } from "@vinscout/domain";

export async function fetchVehicles(limit = 50): Promise<Vehicle[]> {
  const res = await fetch(`/api/vehicles?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch vehicles: ${res.status}`);
  }
  return res.json();
}
