import {
  findRankingsLevel,
  omitsRankColumn,
  rankingsLevels,
} from "./rankings.constants";

describe("rankingsLevels", () => {
  it("defines 13 levels: 8 boys and 5 girls", () => {
    const levels = rankingsLevels(2026);
    expect(levels).toHaveLength(13);
    expect(levels.filter((l) => l.gender === "boys")).toHaveLength(8);
    expect(levels.filter((l) => l.gender === "girls")).toHaveLength(5);
  });

  it("keys each level uniquely by age + gender", () => {
    const keys = rankingsLevels(2026).map((l) => `${l.gender}-${l.age}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("propagates the requested year to every level", () => {
    expect(rankingsLevels(2027).every((l) => l.year === 2027)).toBe(true);
  });
});

describe("findRankingsLevel", () => {
  it("resolves a boys level to the correct MHR list id", () => {
    expect(findRankingsLevel(2026, "12u", "boys")).toEqual({
      gender: "boys",
      level: "pewee",
      age: "12u",
      year: 2026,
      v: 124,
    });
  });

  it("distinguishes girls from boys at a shared age", () => {
    // 10u, 14u and 16u exist for both genders — selecting by age alone is ambiguous.
    expect(findRankingsLevel(2026, "10u", "boys").v).toBe(122);
    expect(findRankingsLevel(2026, "10u", "girls").v).toBe(3118);
    expect(findRankingsLevel(2026, "16u", "boys").v).toBe(112);
    expect(findRankingsLevel(2026, "16u", "girls").v).toBe(2042);
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(findRankingsLevel(2026, " 19U ", "GIRLS").v).toBe(2041);
  });

  it("throws a helpful error for an unknown combination", () => {
    // 19u only exists for girls, 18u only for boys.
    expect(() => findRankingsLevel(2026, "19u", "boys")).toThrow(
      /No rankings level for age "19u" and gender "boys"/
    );
    expect(() => findRankingsLevel(2026, "18u", "girls")).toThrow(
      /Valid combinations:/
    );
    expect(() => findRankingsLevel(2026, "7u", "boys")).toThrow();
  });
});

describe("omitsRankColumn", () => {
  it("is true only for 9u and 10u, which lack the leading rank column", () => {
    const levels = rankingsLevels(2026);
    const shifted = levels
      .filter(omitsRankColumn)
      .map((l) => `${l.gender} ${l.age}`);

    expect(shifted).toEqual(["boys 9u", "boys 10u", "girls 10u"]);
  });

  it("is false for older ages", () => {
    expect(omitsRankColumn(findRankingsLevel(2026, "12u", "boys"))).toBe(false);
    expect(omitsRankColumn(findRankingsLevel(2026, "19u", "girls"))).toBe(false);
  });
});
