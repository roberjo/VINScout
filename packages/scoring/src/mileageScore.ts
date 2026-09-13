// Opportunity factor: Mileage (spec §18, 20% weight). Compares actual
// mileage to an expected baseline of ~12,000 mi/year (a commonly cited
// average US annual mileage) for the vehicle's age. Centered at 50 for
// "exactly as expected," symmetric like marketPriceAdvantageScore — a
// first-pass heuristic, not a derived model.
const EXPECTED_MILES_PER_YEAR = 12000;
const SENSITIVITY = 100;

export function mileageScore(mileage: number, modelYear: number, currentYear: number): number {
  const age = Math.max(1, currentYear - modelYear);
  const expectedMileage = age * EXPECTED_MILES_PER_YEAR;
  const ratio = mileage / expectedMileage;

  const score = 50 - (ratio - 1) * SENSITIVITY;
  return Math.max(0, Math.min(100, Math.round(score)));
}
