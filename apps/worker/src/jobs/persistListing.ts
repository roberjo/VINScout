import { HistoryStatus, type NormalizedListing } from "@vinscout/domain";
import { evaluateHistory } from "@vinscout/scoring";
import type { Env } from "../env";
import { detectHistoryProvider } from "../history/detectHistoryProvider";

// Spec §13 — VIN Deduplication. One `vehicles` row per VIN regardless of how
// many sources list it; each source/listing gets its own `listings` row.
// A brand-new VIN runs the history gate exactly once, at first sight — no
// history-provider integration exists yet (spec §9-10), so every vehicle
// starts UNKNOWN and is therefore rejected until that's built.
export async function persistNormalizedListing(env: Env, listing: NormalizedListing): Promise<void> {
  const existingVehicle = await env.DB.prepare("SELECT vin FROM vehicles WHERE vin = ?")
    .bind(listing.vin)
    .first<{ vin: string }>();

  if (existingVehicle) {
    await env.DB.prepare("UPDATE vehicles SET mileage = ?, last_seen_at = ? WHERE vin = ?")
      .bind(listing.mileage, listing.observedAt, listing.vin)
      .run();
  } else {
    const decision = evaluateHistory({
      accidentReported: false,
      damageReported: false,
      structuralDamage: false,
      airbagDeployment: false,
      totalLoss: false,
      salvageTitle: false,
      rebuiltTitle: false,
      floodDamage: false,
      lemonBuyback: false,
      odometerProblem: false,
      historyStatus: HistoryStatus.UNKNOWN,
    });

    await env.DB.prepare(
      `INSERT INTO vehicles
         (vin, year, make, model, trim, mileage, first_seen_at, last_seen_at, history_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        listing.vin,
        listing.year,
        listing.make,
        listing.model,
        listing.trim ?? null,
        listing.mileage,
        listing.discoveredAt,
        listing.observedAt,
        decision.status,
        decision.eligible ? "ACTIVE" : "REJECTED",
      )
      .run();

    if (!decision.eligible) {
      await env.DB.prepare(
        `INSERT INTO rejection_events (vin, rejection_type, reason, source, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
        .bind(listing.vin, "HISTORY_GATE", decision.reasons.join("; "), listing.source, listing.observedAt)
        .run();
    }
  }

  if (listing.historyReportUrl) {
    await recordHistoryReportLink(env, listing.vin, listing.historyReportUrl, listing.observedAt);
  }

  const existingListing = await env.DB.prepare(
    "SELECT id, price FROM listings WHERE vin = ? AND source = ? AND listing_url = ?",
  )
    .bind(listing.vin, listing.source, listing.listingUrl)
    .first<{ id: number; price: number }>();

  if (existingListing) {
    await env.DB.prepare(
      "UPDATE listings SET price = ?, mileage = ?, last_seen_at = ?, active = 1, photo_count = ?, primary_image_url = ? WHERE id = ?",
    )
      .bind(
        listing.price,
        listing.mileage,
        listing.observedAt,
        listing.photoCount ?? null,
        listing.primaryImageUrl ?? null,
        existingListing.id,
      )
      .run();

    if (existingListing.price !== listing.price) {
      await env.DB.prepare("INSERT INTO price_history (vin, price, observed_at, source) VALUES (?, ?, ?, ?)")
        .bind(listing.vin, listing.price, listing.observedAt, listing.source)
        .run();
    }
    return;
  }

  await env.DB.prepare(
    `INSERT INTO listings
       (vin, source, dealer_name, dealer_city, dealer_state, price, mileage, listing_url, first_seen_at, last_seen_at, active, photo_count, primary_image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(
      listing.vin,
      listing.source,
      listing.dealerName,
      listing.dealerCity,
      listing.dealerState,
      listing.price,
      listing.mileage,
      listing.listingUrl,
      listing.observedAt,
      listing.observedAt,
      listing.photoCount ?? null,
      listing.primaryImageUrl ?? null,
    )
    .run();

  await env.DB.prepare("INSERT INTO price_history (vin, price, observed_at, source) VALUES (?, ?, ?, ?)")
    .bind(listing.vin, listing.price, listing.observedAt, listing.source)
    .run();
}

// Surfaces a Carfax/AutoCheck link the dealer published on their own listing
// page as HistoryEvidence, for a human to click through and verify manually
// (see docs/history-gate.md — this deliberately never fetches the report
// itself). Dedup'd by (vin, source_url) so repeated cron runs don't pile up
// duplicate evidence rows for the same static link.
async function recordHistoryReportLink(env: Env, vin: string, sourceUrl: string, retrievedAt: string): Promise<void> {
  const existing = await env.DB.prepare("SELECT id FROM history_evidence WHERE vin = ? AND source_url = ?")
    .bind(vin, sourceUrl)
    .first<{ id: number }>();
  if (existing) return;

  await env.DB.prepare(
    `INSERT INTO history_evidence (vin, provider, event_type, source_url, retrieved_at)
     VALUES (?, ?, 'REPORT_LINK', ?, ?)`,
  )
    .bind(vin, detectHistoryProvider(sourceUrl), sourceUrl, retrievedAt)
    .run();
}
