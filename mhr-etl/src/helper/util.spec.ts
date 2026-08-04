import { resolveSeasonYear } from "./util";

describe("resolveSeasonYear", () => {
  // MHR seasons run Sept–Aug and are labelled with the year they END.
  it("returns the next calendar year for September onward", () => {
    expect(resolveSeasonYear(new Date("2026-09-01T12:00:00"))).toBe(2027);
    expect(resolveSeasonYear(new Date("2026-10-15T12:00:00"))).toBe(2027);
    expect(resolveSeasonYear(new Date("2026-12-31T12:00:00"))).toBe(2027);
  });

  it("returns the current calendar year for January through August", () => {
    expect(resolveSeasonYear(new Date("2026-01-01T12:00:00"))).toBe(2026);
    expect(resolveSeasonYear(new Date("2026-05-20T12:00:00"))).toBe(2026);
    expect(resolveSeasonYear(new Date("2026-08-31T12:00:00"))).toBe(2026);
  });

  it("flips exactly at the Aug 31 / Sep 1 boundary", () => {
    expect(resolveSeasonYear(new Date("2026-08-31T23:59:59"))).toBe(2026);
    expect(resolveSeasonYear(new Date("2026-09-01T00:00:00"))).toBe(2027);
  });
});
