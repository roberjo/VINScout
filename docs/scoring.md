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

**Status: fully implemented.** All 7 factors compute for real and `opportunity_score` populates the ranked "Opportunities" list. `apps/worker/src/scoring/computeOpportunityScore.ts` assembles them and runs right after market value + maintenance, at the end of manual history verification:

- **Market price advantage** — from the value engine below (defaults to neutral 50 if there are no comparables yet).
- **Mileage** — `mileageScore` (`packages/scoring/src/mileageScore.ts`): compares actual mileage to an expected ~12k mi/year baseline for the vehicle's age, centered at 50.
- **Maintenance exposure** — from the maintenance engine below.
- **Reliability/powertrain** — `computeReliabilityScore` (`apps/worker/src/scoring/computeReliabilitySignal.ts`) calls **NHTSA's free public Recalls API** (`recallsByVehicle`, no key/signup needed) and counts historical safety recall campaigns for the make/model/year; `reliabilityScoreFromRecallCount` maps that to 0-100 with a capped penalty so a heavily-recalled model doesn't hit 0. This counts *campaigns ever issued*, not confirmed-unresolved-for-this-VIN recalls — a rough proxy, same caveat as everything else here. Falls back to a neutral 50 if NHTSA is unreachable.
- **Age** — `ageScore` (`packages/scoring/src/ageScore.ts`): 8 points off per year old, clamped.
- **Trim/equipment** — `trimScore` (`packages/scoring/src/trimScore.ts`): no source gives a real options list, so this is a naming-convention heuristic — unknown trim is neutral, a known trim nudges up slightly, and a recognized "upper trim" keyword (Limited, Denali, Overland, Laramie, etc.) nudges up more. Will misjudge brands/models it doesn't recognize.
- **Dealer/listing quality** — `dealerQualityScore` (`packages/scoring/src/dealerQualityScore.ts`): Auto.dev's `photoCount` field, scaled to 0-100 (20+ photos = max). Plumbed through `NormalizedListing.photoCount` → `listings.photo_count` (`migrations/0004_listing_photo_count.sql`). Unknown photo count is neutral, not penalized.

All of the scoring constants above (weights within each factor, penalty rates, thresholds) are first-pass heuristics, not derived from data — documented as such in each function's own comments. Verified end-to-end locally against real Auto.dev inventory: two real vehicles (a 2020 Honda Pilot, a 2017 Jeep Wrangler) correctly produced `opportunity_score`s of 65.65 and 66.1 and appeared correctly sorted (highest first) in `GET /api/vehicles`.

## Value engine (spec §17) — implemented

`packages/scoring/src/marketValue.ts`:

- `estimateMarketValue(target, candidates)` — pure, tested. Given a target's asking price/mileage and a list of candidate comparables (price + mileage), filters candidates to within ±30% of the target's mileage (a cheap stand-in for a real regression — same make/model/year can still vary a lot by mileage) and averages their price into an `estimatedMarketPrice`. Returns `null` when nothing survives the mileage filter — "not enough data," not a wrong answer.
- `marketPriceAdvantageScore(comparison)` — maps the result to a 0-100 sub-score (50 = at market, +3 points per percent under, -3 per percent over, clamped). The 3x multiplier is a first-pass heuristic, not derived from data.

`apps/worker/src/scoring/computeMarketValue.ts` does the impure half: pulls the target's current active listing price, queries `listings` joined to `vehicles` for the same make/model within ±1 model year, and writes the resulting score to `vehicles.value_score`. Triggered once, right after a vehicle passes manual history verification (`applyHistoryVerification`) — it does **not** get refreshed later as more comparables arrive, which is a known gap worth revisiting once there's enough inventory volume for that to matter.

Verified against real Auto.dev inventory: three 2017 Jeep Wranglers gave a correct averaged comparison (`value_score` 39.2 for one priced slightly above its two comparables); a unique model (no comparables within the mileage band) correctly left `value_score` `null` rather than erroring or guessing.

## Maintenance engine (spec §19-20) — implemented, v1 rule set

`packages/scoring/src/maintenanceRules.ts`:

- `evaluateMaintenanceRisk(target, rules?)` — pure, tested. Matches applicable `MaintenanceRule`s (make/model, optionally year range) against the vehicle. A rule with no `mileageThreshold` is a condition-dependent wear item (brakes, tires) and is always included with `UNKNOWN` dueness — matching the spec's own worked example, which lists brakes/tires as "unknown" regardless of mileage. A rule with a threshold gets `POSSIBLE_DUE`/`LIKELY_DUE`/`KNOWN_DUE` based on how close current mileage is to it (75%/90%/100%), or is omitted entirely if mileage is well below it.
- `DEFAULT_MAINTENANCE_RULES` — intentionally small: the two generic wear items plus **one** model-specific rule (2009-2015 Honda Pilot 3.5L V6 timing belt, ~105k mi interval) chosen because it's well-documented and I'm confident it's correct. This is explicitly a starting reference set, not an authoritative maintenance database — expand it carefully against real manufacturer service schedules, and don't add a specific claim without being confident it's accurate for that exact make/model/year.
- Confidence is hardcoded to `LOW` — there's no VIN-specific service history (spec §10) to draw on, only generic mileage rules, so the engine is honest about how little it actually knows about any given vehicle's real condition.

`apps/worker/src/maintenance/computeMaintenanceRisk.ts` is the impure half: reads the vehicle's make/model/year/mileage from D1 and writes the resulting score to `vehicles.maintenance_score`. Triggered the same place as the value engine — right after a vehicle passes manual history verification.

Verified locally: the spec's own worked example (2019 Toyota Highlander, 96k mi) scores 96 (only the two generic UNKNOWN items apply); a 2020 Honda Pilot correctly gets the same score since the timing-belt rule's year range (2009-2015) excludes it.
