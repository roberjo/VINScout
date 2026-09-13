import { z } from "zod";

// A user-editable subset of SearchCriteria (spec §15) — just the "personal
// taste" attributes that filter what gets discovered in the first place, so
// a vehicle outside your taste never enters the pipeline at all (and never
// reaches manual Carfax review). Location and the requireClean* flags stay
// fixed (see discoverListings.ts) since changing those isn't what this is
// for.
export const discoveryPreferencesSchema = z.object({
  makes: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  mileageMax: z.number().nonnegative().optional(),
  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),
});

export type DiscoveryPreferences = z.infer<typeof discoveryPreferencesSchema>;

// spec §14 — watchlists (id, name, criteria_json, created_at). Each named
// watchlist is applied as its own discovery pass, so the count is capped
// (see apps/worker/src/api/watchlists.ts) to protect the free-tier API quota.
export const watchlistInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  criteria: discoveryPreferencesSchema,
});

export type WatchlistInput = z.infer<typeof watchlistInputSchema>;

