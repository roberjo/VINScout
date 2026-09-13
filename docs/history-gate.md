# History Gate

Implemented in `packages/scoring/src/historyGate.ts` (spec §9).

`evaluateHistory` is a pure function: given a vehicle's history flags and `HistoryStatus`, it returns whether the vehicle is eligible for scoring, plus every reason it failed (not just the first).

Key invariant, enforced by the function itself: **`UNKNOWN` history status is a rejection, not a pass.** A vehicle with no reported problems but unverified history is not "clean" — it's ineligible until verified.

Downstream, `scoreOpportunity` (`packages/scoring/src/opportunityScore.ts`) takes a `HistoryDecision` as input and refuses to produce a score when `eligible` is `false`, regardless of how good the vehicle's price or condition otherwise looks. This is the "history before value" principle from spec §2 — enforced in code, not just by convention.

## History evidence (spec §10)

Every history claim should be traceable to a `HistoryEvidence` record (provider, event type, source URL, retrieval timestamp) stored in the `history_evidence` table (`migrations/0003_history.sql`). No history-provider integration exists yet — `historyStatus` on a vehicle currently has no automated way to become anything other than `UNKNOWN`.
