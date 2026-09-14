import { reliabilityScoreFromRecallCount } from "@vinscout/scoring";
import type { Env } from "../env";

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

interface TargetRow {
  make: string;
  model: string;
  year: number;
}

// Persists the reliability sub-score to vehicles.reliability_score at
// discovery time, independent of history status — this is what lets the
// manual review queue show a "clean/notable recall history" highlight
// before a vehicle is ever eligible for the gated opportunity score (which
// recomputes reliability again itself once a vehicle passes history — see
// computeOpportunityScore.ts).
export async function computeAndStoreReliabilityScore(env: Env, vin: string): Promise<void> {
  const target = await env.DB.prepare("SELECT make, model, year FROM vehicles WHERE vin = ?")
    .bind(vin)
    .first<TargetRow>();
  if (!target) return;

  const score = await computeReliabilityScore(target.make, target.model, target.year);

  await env.DB.prepare("UPDATE vehicles SET reliability_score = ? WHERE vin = ?").bind(score, vin).run();
}
