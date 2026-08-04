import { handleBadLocationData, isCanada } from "./normalize";

describe("isCanada", () => {
  it("maps Canadian province and territory codes to Canada", () => {
    for (const region of ["ON", "QC", "BC", "AB", "NU", "YT"]) {
      expect(isCanada(region)).toBe("Canada");
    }
  });

  it("maps everything else to USA", () => {
    for (const region of ["MA", "MN", "NY", "TX"]) {
      expect(isCanada(region)).toBe("USA");
    }
  });

  it("treats UNKNOWN and empty values as USA", () => {
    // Falls through to the default rather than throwing.
    expect(isCanada("UNKNOWN")).toBe("USA");
    expect(isCanada("")).toBe("USA");
  });
});

describe("handleBadLocationData", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("splits a well-formed 'City, State' string", () => {
    expect(
      handleBadLocationData({ location: "Boston, MA", team_name: "Jr Bruins" })
    ).toEqual({ city: "Boston", state: "MA" });
  });

  it("trims surrounding whitespace", () => {
    expect(
      handleBadLocationData({ location: "  Ann Arbor ,  MI ", team_name: "T" })
    ).toEqual({ city: "Ann Arbor", state: "MI" });
  });

  it("keeps only the first two parts of 'City, State, Country'", () => {
    expect(
      handleBadLocationData({ location: "Toronto, ON, Canada", team_name: "T" })
    ).toEqual({ city: "Toronto", state: "ON" });
  });

  it("falls back to UNKNOWN for missing or non-string locations", () => {
    const expected = { city: "UNKNOWN", state: "UNKNOWN" };
    expect(handleBadLocationData({ location: null, team_name: "T" })).toEqual(expected);
    expect(handleBadLocationData({ location: undefined, team_name: "T" })).toEqual(expected);
    expect(handleBadLocationData({ location: "", team_name: "T" })).toEqual(expected);
    expect(handleBadLocationData({ location: 42, team_name: "T" })).toEqual(expected);
  });

  it("keeps a single-token location as the state and marks the city UNKNOWN", () => {
    expect(
      handleBadLocationData({ location: "Massachusetts", team_name: "T" })
    ).toEqual({ city: "UNKNOWN", state: "Massachusetts" });
  });

  it("warns when it cannot parse the location", () => {
    const warn = jest.spyOn(console, "warn");
    handleBadLocationData({ location: null, team_name: "Bad Team" });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Bad Team")
    );
  });
});
