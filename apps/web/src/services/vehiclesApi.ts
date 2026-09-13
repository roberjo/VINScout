import type { Vehicle } from "@vinscout/domain";

// Empty string resolves to a relative /api path, which only works via the
// Vite dev proxy (vite.config.ts) or if web+worker ever share a domain.
// In production, VITE_API_URL points at the deployed Worker.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchVehicles(limit = 50): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/api/vehicles?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch vehicles: ${res.status}`);
  }
  return res.json();
}
