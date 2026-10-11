// Shared by any query that needs a vehicle's single freshest active listing
// joined in (apps/worker/src/api/vehicles.ts and reviewQueue.ts) — a vehicle
// can in principle have more than one active listing (multiple sources), so
// this picks the freshest by last_seen_at via ROW_NUMBER rather than a plain
// JOIN, which would otherwise fan a vehicle out into duplicate rows.
export const CURRENT_LISTING_CTE = `
  WITH current_listing AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY vin ORDER BY last_seen_at DESC) AS rn
    FROM listings
    WHERE active = 1
  )
`;

export const LISTING_JOIN_SELECT = `
  cl.price AS listing_price, cl.listing_url AS listing_url,
  cl.dealer_name AS listing_dealer_name, cl.dealer_city AS listing_dealer_city,
  cl.dealer_state AS listing_dealer_state, cl.primary_image_url AS listing_image_url
`;

export interface ListingJoinFields {
  listing_price: number | null;
  listing_url: string | null;
  listing_dealer_name: string | null;
  listing_dealer_city: string | null;
  listing_dealer_state: string | null;
  listing_image_url: string | null;
}
