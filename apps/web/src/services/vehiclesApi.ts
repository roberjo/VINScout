import type { Vehicle } from "@vinscout/domain";
import type { HistoryVerificationInput, ReviewQueueItem } from "../types/review";

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

export async function fetchReviewQueue(limit = 50): Promise<ReviewQueueItem[]> {
  const res = await fetch(`${API_BASE}/api/review-queue?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch review queue: ${res.status}`);
  }
  return res.json();
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
