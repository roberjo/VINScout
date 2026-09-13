import { describe, expect, it } from "vitest";
import type { RawListing } from "@vinscout/domain";
import { normalizeListing } from "./normalizeListing";

const raw: RawListing = {
  source: "fixture",
  url: "https://example-dealer.test/inventory/5TDBZRFH1KS000001",
  fetchedAt: "2026-09-01T12:00:00.000Z",
  raw: {
    vin: "5TDBZRFH1KS000001",
    year: 2019,
    make: "Toyota",
    model: "Highlander",
    trim: "XLE",
    mileage: 96000,
    price: 23400,
    dealer_name: "Example Toyota",
    dealer_city: "Newnan",
    dealer_state: "GA",
    listing_url: "https://example-dealer.test/inventory/5TDBZRFH1KS000001",
  },
};

describe("normalizeListing", () => {
  it("maps raw snake_case fields to the NormalizedListing shape", () => {
    const normalized = normalizeListing(raw);

    expect(normalized).toEqual({
      vin: "5TDBZRFH1KS000001",
      year: 2019,
      make: "Toyota",
      model: "Highlander",
      trim: "XLE",
      mileage: 96000,
      price: 23400,
      dealerName: "Example Toyota",
      dealerCity: "Newnan",
      dealerState: "GA",
      listingUrl: "https://example-dealer.test/inventory/5TDBZRFH1KS000001",
      source: "fixture",
      discoveredAt: "2026-09-01T12:00:00.000Z",
      observedAt: "2026-09-01T12:00:00.000Z",
    });
  });

  it("passes through a history report link when the dealer published one", () => {
    const normalized = normalizeListing({
      ...raw,
      raw: { ...raw.raw, history_report_url: "https://www.carfax.com/vehicle/5TDBZRFH1KS000001" },
    });

    expect(normalized.historyReportUrl).toBe("https://www.carfax.com/vehicle/5TDBZRFH1KS000001");
  });

  it("leaves the history report link undefined when the dealer didn't publish one", () => {
    const normalized = normalizeListing(raw);
    expect(normalized.historyReportUrl).toBeUndefined();
  });

  it("passes through photo count when the source reports it", () => {
    const normalized = normalizeListing({ ...raw, raw: { ...raw.raw, photo_count: 24 } });
    expect(normalized.photoCount).toBe(24);
  });
});
