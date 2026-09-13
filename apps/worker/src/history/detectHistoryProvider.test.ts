import { describe, expect, it } from "vitest";
import { detectHistoryProvider } from "./detectHistoryProvider";

describe("detectHistoryProvider", () => {
  it("recognizes carfax.com links", () => {
    expect(detectHistoryProvider("https://www.carfax.com/vehicle/5TDBZRFH1KS000001")).toBe("CARFAX");
  });

  it("recognizes autocheck.com links", () => {
    expect(detectHistoryProvider("https://www.autocheck.com/vehiclehistory/abc123")).toBe("AUTOCHECK");
  });

  it("falls back to OTHER for anything else, including a spoofed hostname", () => {
    expect(detectHistoryProvider("https://example-dealer.test/report")).toBe("OTHER");
    expect(detectHistoryProvider("https://notcarfax.com.evil.test/x")).toBe("OTHER");
  });

  it("falls back to OTHER for an unparseable URL instead of throwing", () => {
    expect(detectHistoryProvider("not a url")).toBe("OTHER");
  });
});
