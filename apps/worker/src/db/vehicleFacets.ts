import type { Env } from "../env";

export interface VehicleFacets {
  makes: string[];
  models: string[];
  modelsByMake: Record<string, string[]>;
}

interface MakeModelRow {
  make: string;
  model: string;
}

// Shared by GET /api/vehicles/facets and GET /api/review-queue/facets — each
// scopes to its own set of vehicles (ACTIVE+scored vs. REJECTED) via
// `whereClause`/`params`, built the same way as that endpoint's own listing
// query, so the dropdown options offered can never include a make/model with
// zero results in that section.
export async function fetchVehicleFacets(env: Env, whereClause: string, params: (string | number)[]): Promise<VehicleFacets> {
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT v.make AS make, v.model AS model FROM vehicles v WHERE ${whereClause} ORDER BY v.make, v.model`,
  )
    .bind(...params)
    .all<MakeModelRow>();

  const modelsByMake: Record<string, string[]> = {};
  const modelSet = new Set<string>();

  for (const { make, model } of results) {
    (modelsByMake[make] ??= []).push(model);
    modelSet.add(model);
  }

  return {
    makes: Object.keys(modelsByMake).sort(),
    models: [...modelSet].sort(),
    modelsByMake,
  };
}
