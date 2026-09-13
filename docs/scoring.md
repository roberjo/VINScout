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

**Status:** the weighting function (`scoreOpportunity`) is implemented and tested against pre-computed 0-100 sub-scores. The sub-score calculators themselves — market value comparison (spec §17), maintenance risk (spec §19-20) — are not implemented yet; they need real listing/comparable data to compute against.

## Value engine (spec §17) and maintenance engine (spec §19-20)

Not implemented. See `packages/domain`'s `MarketComparison` and `MaintenanceRisk`/`MaintenanceRule` types for the intended shapes.
