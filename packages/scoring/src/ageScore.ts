// Opportunity factor: Age (spec §18, 5% weight). Simple and monotonic — newer
// is better. 8 points off per year, clamped to [0, 100]; a first-pass
// heuristic like the other scoring constants in this package, not derived
// from data.
const PENALTY_PER_YEAR = 8;

export function ageScore(modelYear: number, currentYear: number): number {
  const age = Math.max(0, currentYear - modelYear);
  return Math.max(0, Math.min(100, Math.round(100 - age * PENALTY_PER_YEAR)));
}
