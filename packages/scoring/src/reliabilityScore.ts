// Opportunity factor: Reliability/powertrain (spec §18, 15% weight). No free
// comprehensive reliability database exists (same situation as vehicle
// history — see docs/history-gate.md). NHTSA's public Recalls API is free
// and legitimate, so this counts historical safety recall campaigns for the
// vehicle's make/model/year as a rough, bounded proxy. This is NOT the same
// as "recalls still unresolved on this specific VIN" — NHTSA's
// recallsByVehicle endpoint returns every campaign ever issued for that
// make/model/year, not per-VIN remedy status. Penalty is capped so a
// heavily-recalled (but otherwise fine) model doesn't get zeroed out.
const PENALTY_PER_RECALL = 5;
const MAX_PENALTY = 70;

export function reliabilityScoreFromRecallCount(recallCount: number): number {
  const penalty = Math.min(Math.max(0, recallCount) * PENALTY_PER_RECALL, MAX_PENALTY);
  return Math.round(100 - penalty);
}
