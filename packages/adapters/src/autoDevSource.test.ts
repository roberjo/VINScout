import { describe, expect, it } from "vitest";
import { mapAutoDevListingToRaw, type AutoDevListingItem } from "./autoDevSource";

const FETCHED_AT = "2026-09-14T12:00:00.000Z";

const FULL_ITEM: AutoDevListingItem = {
  vin: "10ARJYBS7RC154562",
  vehicle: { vin: "10ARJYBS7RC154562", year: 2022, make: "Toyota", model: "RAV4", trim: "XLE" },
  retailListing: {
    vdp: "https://dealer.example/vdp/10ARJYBS7RC154562",
    price: 27995,
    miles: 31000,
    dealer: "Example Toyota",
    city: "Newnan",
    state: "GA",
    carfaxUrl: "https://www.carfax.com/vehicle/10ARJYBS7RC154562",
  },
};

describe("mapAutoDevListingToRaw", () => {
  it("maps a complete listing", () => {
    const raw = mapAutoDevListingToRaw(FULL_ITEM, FETCHED_AT);
    expect(raw).toEqual({
      source: "autodev",
      url: "https://dealer.example/vdp/10ARJYBS7RC154562",
      fetchedAt: FETCHED_AT,
      raw: {
        vin: "10ARJYBS7RC154562",
        year: 2022,
        make: "Toyota",
        model: "RAV4",
        trim: "XLE",
        mileage: 31000,
        price: 27995,
        dealer_name: "Example Toyota",
        dealer_city: "Newnan",
        dealer_state: "GA",
        listing_url: "https://dealer.example/vdp/10ARJYBS7RC154562",
        history_report_url: "https://www.carfax.com/vehicle/10ARJYBS7RC154562",
      },
    });
  });

  it("omits history_report_url when Auto.dev didn't return a carfaxUrl", () => {
    const raw = mapAutoDevListingToRaw(
      { ...FULL_ITEM, retailListing: { ...FULL_ITEM.retailListing, carfaxUrl: undefined } },
      FETCHED_AT,
    );
    expect(raw?.raw.history_report_url).toBeUndefined();
  });

  it("returns null when price is missing", () => {
    const raw = mapAutoDevListingToRaw(
      { ...FULL_ITEM, retailListing: { ...FULL_ITEM.retailListing, price: undefined } },
      FETCHED_AT,
    );
    expect(raw).toBeNull();
  });

  it("returns null when the listing has no VIN anywhere", () => {
    const raw = mapAutoDevListingToRaw({ ...FULL_ITEM, vin: undefined, vehicle: { ...FULL_ITEM.vehicle, vin: undefined } }, FETCHED_AT);
    expect(raw).toBeNull();
  });

  it("falls back to vehicle.vin when the top-level vin is absent", () => {
    const raw = mapAutoDevListingToRaw({ ...FULL_ITEM, vin: undefined }, FETCHED_AT);
    expect(raw?.raw.vin).toBe("10ARJYBS7RC154562");
  });

  it("coerces a numeric model (e.g. Ram '1500') to a clean string, not '1500.0'", () => {
    const raw = mapAutoDevListingToRaw({ ...FULL_ITEM, vehicle: { ...FULL_ITEM.vehicle, make: "Ram", model: 1500 } }, FETCHED_AT);
    expect(raw?.raw.model).toBe("1500");
  });

  it("passes through photo count when Auto.dev reports one", () => {
    const raw = mapAutoDevListingToRaw(
      { ...FULL_ITEM, retailListing: { ...FULL_ITEM.retailListing, photoCount: 18 } },
      FETCHED_AT,
    );
    expect(raw?.raw.photo_count).toBe(18);
  });

  it("passes through the primary image URL when Auto.dev reports one", () => {
    const raw = mapAutoDevListingToRaw(
      { ...FULL_ITEM, retailListing: { ...FULL_ITEM.retailListing, primaryImage: "https://cdn.example/photo.jpg" } },
      FETCHED_AT,
    );
    expect(raw?.raw.primary_image_url).toBe("https://cdn.example/photo.jpg");
  });
});
