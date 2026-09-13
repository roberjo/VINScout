import type { InventorySource } from "@vinscout/adapters";
import type { Env } from "../env";

// Spec §48 build order, step 14: additional inventory adapters register
// here as they're built (spec §12 — Source Priority). None exist yet, so
// this job is currently a no-op that just confirms the cron wiring runs.
const sources: InventorySource[] = [];

export async function discoverListings(env: Env): Promise<void> {
  if (sources.length === 0) {
    console.log("discoverListings: no inventory sources registered yet");
    return;
  }

  for (const source of sources) {
    console.log(`discoverListings: running ${source.name}`);
    // TODO: discover -> normalize -> VIN dedup -> history gate -> persist to D1.
  }

  void env;
}
