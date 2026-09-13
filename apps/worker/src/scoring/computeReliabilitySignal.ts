import { reliabilityScoreFromRecallCount } from "@vinscout/scoring";

const NHTSA_RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";

// Spec §18's reliability/powertrain factor. NHTSA's Recalls API is free,
// public, and needs no key or signup — counts every safety recall campaign
// ever issued for this make/model/year (not per-VIN remedy status; see
// reliabilityScoreFromRecallCount). Returns a neutral 50 rather than
// failing the whole scoring pass if NHTSA is unreachable or errors.
export async function computeReliabilityScore(
  make: string,
  model: string,
  year: number,
  fetchImpl: typeof fetch = fetch.bind(globalThis),
): Promise<number> {
  try {
    const params = new URLSearchParams({ make, model, modelYear: String(year) });
    const res = await fetchImpl(`${NHTSA_RECALLS_URL}?${params.toString()}`);
    if (!res.ok) return 50;

    const body = (await res.json()) as { Count?: number };
    return reliabilityScoreFromRecallCount(body.Count ?? 0);
  } catch (err) {
    console.error("computeReliabilityScore: NHTSA request failed", err);
    return 50;
  }
}
