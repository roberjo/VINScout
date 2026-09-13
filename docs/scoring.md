# Scoring

Implemented in `packages/scoring`.

## Opportunity score (spec §18)

Only vehicles that passed the history gate receive a score (0-100):

| Factor | Weight |
|---|---|
| Market price advantage | 30% |
| Mileage | 20% |
| Maintenance exposure | 15% |
| Reliability/powertrain | 15% |
| Trim/equipment | 10% |
| Age | 5% |
| Dealer/listing quality | 5% |

Interpretation: 90-100 exceptional, 80-89 excellent, 70-79 strong, 60-69 fair, <60 weak.

**Status:** the weighting function (`scoreOpportunity`) is implemented and tested against pre-computed 0-100 sub-scores. One sub-score — market price advantage — is now computed for real (see below). The rest (mileage, maintenance exposure, reliability/powertrain, trim/equipment, age, dealer/listing quality) aren't implemented yet, so `opportunity_score` stays unset and vehicles don't appear in the ranked "Opportunities" list even after being verified clean.

## Value engine (spec §17) — implemented

`packages/scoring/src/marketValue.ts`:

- `estimateMarketValue(target, candidates)` — pure, tested. Given a target's asking price/mileage and a list of candidate comparables (price + mileage), filters candidates to within ±30% of the target's mileage (a cheap stand-in for a real regression — same make/model/year can still vary a lot by mileage) and averages their price into an `estimatedMarketPrice`. Returns `null` when nothing survives the mileage filter — "not enough data," not a wrong answer.
- `marketPriceAdvantageScore(comparison)` — maps the result to a 0-100 sub-score (50 = at market, +3 points per percent under, -3 per percent over, clamped). The 3x multiplier is a first-pass heuristic, not derived from data.

`apps/worker/src/scoring/computeMarketValue.ts` does the impure half: pulls the target's current active listing price, queries `listings` joined to `vehicles` for the same make/model within ±1 model year, and writes the resulting score to `vehicles.value_score`. Triggered once, right after a vehicle passes manual history verification (`applyHistoryVerification`) — it does **not** get refreshed later as more comparables arrive, which is a known gap worth revisiting once there's enough inventory volume for that to matter.

Verified against real Auto.dev inventory: three 2017 Jeep Wranglers gave a correct averaged comparison (`value_score` 39.2 for one priced slightly above its two comparables); a unique model (no comparables within the mileage band) correctly left `value_score` `null` rather than erroring or guessing.

## Maintenance engine (spec §19-20)

Not implemented. See `packages/domain`'s `MaintenanceRisk`/`MaintenanceRule` types for the intended shape. This is the remaining blocker before `opportunity_score` (and therefore the "Opportunities" dashboard list) can populate.
