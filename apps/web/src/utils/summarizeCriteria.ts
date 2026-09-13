import type { DiscoveryPreferences } from "../types/preferences";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Renders a saved watchlist's criteria as short chip labels, so the current
// filter status is visible at a glance without opening an edit form.
export function summarizeCriteria(c: DiscoveryPreferences): string[] {
  const chips: string[] = [];

  if (c.makes?.length) chips.push(c.makes.join(", "));
  if (c.models?.length) chips.push(c.models.join(", "));

  if (c.priceMin != null && c.priceMax != null) {
    chips.push(`${currency.format(c.priceMin)}–${currency.format(c.priceMax)}`);
  } else if (c.priceMax != null) {
    chips.push(`≤ ${currency.format(c.priceMax)}`);
  } else if (c.priceMin != null) {
    chips.push(`≥ ${currency.format(c.priceMin)}`);
  }

  if (c.mileageMax != null) chips.push(`≤ ${c.mileageMax.toLocaleString()} mi`);

  if (c.yearMin != null && c.yearMax != null) {
    chips.push(`${c.yearMin}–${c.yearMax}`);
  } else if (c.yearMin != null) {
    chips.push(`${c.yearMin}+`);
  } else if (c.yearMax != null) {
    chips.push(`through ${c.yearMax}`);
  }

  return chips.length > 0 ? chips : ["All inventory (no filters)"];
}
