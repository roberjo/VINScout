import { z } from "zod";

// Validates SearchCriteria (spec §15) coming in from API requests / saved
// watchlists, where the shape can't be trusted at compile time.
export const searchCriteriaSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMiles: z.number().positive(),
  }),

  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),

  mileageMax: z.number().nonnegative().optional(),

  years: z
    .object({
      min: z.number().int().optional(),
      max: z.number().int().optional(),
    })
    .optional(),

  makes: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
  trims: z.array(z.string()).optional(),

  drivetrains: z.array(z.string()).optional(),

  requireCleanHistory: z.boolean(),
  requireCleanTitle: z.boolean(),

  maxOwners: z.number().int().positive().optional(),
});

export type SearchCriteriaInput = z.infer<typeof searchCriteriaSchema>;
