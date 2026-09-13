import type { HistoryVerificationInput, ReviewQueueItem } from "../types/review";
import type { VehicleFilters, VehicleWithListing } from "../types/vehicle";
import type { HistoryEvidenceEntry } from "../types/evidence";
import type { DiscoveryPreferences, Watchlist } from "../types/preferences";

// Empty string resolves to a relative /api path, which only works via the
// Vite dev proxy (vite.config.ts) or if web+worker ever share a domain.
// In production, VITE_API_URL points at the deployed Worker.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

// The dashboard and the Worker API live on different hostnames, each behind
// its own Cloudflare Access application — credentials: "include" is required
// on every call so the browser sends the Access session cookie cross-origin
// (paired with the Worker's CORS config naming this exact origin, since a
// wildcard origin can't be combined with credentialed requests).
function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { ...init, credentials: "include" });
}

export async function fetchVehicles(filters: VehicleFilters = {}, limit = 50): Promise<VehicleWithListing[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters.make) params.set("make", filters.make);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.mileageMax != null) params.set("mileageMax", String(filters.mileageMax));

  const res = await apiFetch(`/api/vehicles?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch vehicles: ${res.status}`);
  }
  return res.json();
}

export async function fetchVehicleEvidence(vin: string): Promise<HistoryEvidenceEntry[]> {
  const res = await apiFetch(`/api/vehicles/${encodeURIComponent(vin)}/evidence`);
  if (!res.ok) {
    throw new Error(`Failed to fetch evidence: ${res.status}`);
  }
  return res.json();
}

export async function fetchReviewQueue(limit = 50): Promise<ReviewQueueItem[]> {
  const res = await apiFetch(`/api/review-queue?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch review queue: ${res.status}`);
  }
  return res.json();
}

export async function fetchWatchlists(): Promise<Watchlist[]> {
  const res = await apiFetch("/api/watchlists");
  if (!res.ok) {
    throw new Error(`Failed to fetch saved searches: ${res.status}`);
  }
  return res.json();
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  throw new Error((body && typeof body === "object" && "error" in body && String(body.error)) || fallback);
}

export async function createWatchlist(name: string, criteria: DiscoveryPreferences): Promise<Watchlist> {
  const res = await apiFetch("/api/watchlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, criteria }),
  });
  if (!res.ok) return throwApiError(res, `Failed to create saved search: ${res.status}`);
  return res.json();
}

export async function updateWatchlist(id: number, name: string, criteria: DiscoveryPreferences): Promise<Watchlist> {
  const res = await apiFetch(`/api/watchlists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, criteria }),
  });
  if (!res.ok) return throwApiError(res, `Failed to update saved search: ${res.status}`);
  return res.json();
}

export async function deleteWatchlist(id: number): Promise<void> {
  const res = await apiFetch(`/api/watchlists/${id}`, { method: "DELETE" });
  if (!res.ok) return throwApiError(res, `Failed to delete saved search: ${res.status}`);
}

export async function submitHistoryVerification(vin: string, input: HistoryVerificationInput): Promise<void> {
  const res = await apiFetch(`/api/vehicles/${encodeURIComponent(vin)}/history`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit history verification: ${res.status}`);
  }
}
