import type { HistoryVerificationInput, ReviewQueueItem } from "../types/review";
import type { VehicleFilters, VehicleWithListing } from "../types/vehicle";
import type { HistoryEvidenceEntry } from "../types/evidence";
import type { DiscoveryPreferences } from "../types/preferences";

// Empty string resolves to a relative /api path, which only works via the
// Vite dev proxy (vite.config.ts) or if web+worker ever share a domain.
// In production, VITE_API_URL points at the deployed Worker.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchVehicles(filters: VehicleFilters = {}, limit = 50): Promise<VehicleWithListing[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters.make) params.set("make", filters.make);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.mileageMax != null) params.set("mileageMax", String(filters.mileageMax));

  const res = await fetch(`${API_BASE}/api/vehicles?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch vehicles: ${res.status}`);
  }
  return res.json();
}

export async function fetchVehicleEvidence(vin: string): Promise<HistoryEvidenceEntry[]> {
  const res = await fetch(`${API_BASE}/api/vehicles/${encodeURIComponent(vin)}/evidence`);
  if (!res.ok) {
    throw new Error(`Failed to fetch evidence: ${res.status}`);
  }
  return res.json();
}

export async function fetchReviewQueue(limit = 50): Promise<ReviewQueueItem[]> {
  const res = await fetch(`${API_BASE}/api/review-queue?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch review queue: ${res.status}`);
  }
  return res.json();
}

export async function fetchDiscoveryPreferences(): Promise<DiscoveryPreferences> {
  const res = await fetch(`${API_BASE}/api/preferences`);
  if (!res.ok) {
    throw new Error(`Failed to fetch preferences: ${res.status}`);
  }
  return res.json();
}

export async function saveDiscoveryPreferences(prefs: DiscoveryPreferences): Promise<void> {
  const res = await fetch(`${API_BASE}/api/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) {
    throw new Error(`Failed to save preferences: ${res.status}`);
  }
}

export async function submitHistoryVerification(vin: string, input: HistoryVerificationInput): Promise<void> {
  const res = await fetch(`${API_BASE}/api/vehicles/${encodeURIComponent(vin)}/history`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit history verification: ${res.status}`);
  }
}
