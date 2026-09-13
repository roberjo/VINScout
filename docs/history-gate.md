# History Gate

Implemented in `packages/scoring/src/historyGate.ts` (spec §9).

`evaluateHistory` is a pure function: given a vehicle's history flags and `HistoryStatus`, it returns whether the vehicle is eligible for scoring, plus every reason it failed (not just the first).

Key invariant, enforced by the function itself: **`UNKNOWN` history status is a rejection, not a pass.** A vehicle with no reported problems but unverified history is not "clean" — it's ineligible until verified.

Downstream, `scoreOpportunity` (`packages/scoring/src/opportunityScore.ts`) takes a `HistoryDecision` as input and refuses to produce a score when `eligible` is `false`, regardless of how good the vehicle's price or condition otherwise looks. This is the "history before value" principle from spec §2 — enforced in code, not just by convention.

## History evidence (spec §10)

Every history claim is traceable to a `HistoryEvidence` record (provider, event type, source URL, retrieval timestamp) stored in the `history_evidence` table (`migrations/0003_history.sql`).

## Why verification is manual, not automated

There's no free, comprehensive, automatable history API. NMVTIS (the federal salvage/total-loss/odometer-brand database) is only reachable through an approved data provider that charges per lookup; Carfax and AutoCheck are paid with no developer API; NICB VINCheck is free but capped at 5 lookups/day, sits behind a CAPTCHA, and its terms don't permit automated querying. So automating any of them either costs money we don't have or violates the provider's terms of service (the spec itself requires respecting each source's ToS — see spec §12).

What's built instead:

1. **Link surfacing** (`apps/worker/src/jobs/persistListing.ts`'s `recordHistoryReportLink`): if a dealer publishes a free Carfax/AutoCheck link on their own listing page, it's captured as `HistoryEvidence` (`event_type = 'REPORT_LINK'`) during normal discovery — no different from capturing price or mileage. `detectHistoryProvider` (`apps/worker/src/history/detectHistoryProvider.ts`) identifies which provider a link points to, by hostname, purely for display. **Nothing ever fetches the report page itself.**
2. **Manual verification** (`apps/worker/src/history/verifyHistory.ts`, exposed as `PATCH /api/vehicles/:vin/history`): a human clicks the surfaced link (or checks NICB VINCheck by hand), reads the report, and submits the actual flags through the dashboard's "Needs Review" section (`apps/web/src/components/ReviewQueue.tsx`). That re-runs `evaluateHistory` for real and persists the outcome, plus a `MANUAL_REVIEW` evidence row recording what was found.

A vehicle stays `UNKNOWN` (and therefore rejected) until step 2 happens for it — there's no automated path to `CLEAN_VERIFIED`.
