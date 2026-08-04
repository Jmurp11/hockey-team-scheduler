export type Gender = "boys" | "girls";

export interface RankingsLevel {
  gender: Gender;
  level: string;
  age: string;
  year: number;
  /** MyHockeyRankings' internal ranking-list id (the `v` query param). */
  v: number;
}

export const rankingsLevels = (year: number): RankingsLevel[] => [
  { gender: "boys", level: "squirt", age: "9u", year: year, v: 121 },
  { gender: "boys", level: "squirt", age: "10u", year: year, v: 122 },
  { gender: "boys", level: "pewee", age: "11u", year: year, v: 123 },
  { gender: "boys", level: "pewee", age: "12u", year: year, v: 124 },
  { gender: "boys", level: "bantam", age: "13u", year: year, v: 125 },
  { gender: "boys", level: "bantam", age: "14u", year: year, v: 114 },
  { gender: "boys", level: "midget-minor", age: "16u", year: year, v: 112 },
  { gender: "boys", level: "midget-major", age: "18u", year: year, v: 111 },
  { gender: "girls", level: "squirt", age: "10u", year: year, v: 3118 },
  { gender: "girls", level: "pewee", age: "12u", year: year, v: 2044 },
  { gender: "girls", level: "bantam", age: "14u", year: year, v: 2043 },
  { gender: "girls", level: "midget-minor", age: "16u", year: year, v: 2042 },
  { gender: "girls", level: "midget-major", age: "19u", year: year, v: 2041 },
];

/**
 * Resolve a level by its natural key (age + gender) rather than by array
 * position. Selecting by index previously coupled both the CI matrix and the
 * `girls_only` flag to the ordering of the array above, so reordering it
 * would silently mislabel teams.
 */
export function findRankingsLevel(
  year: number,
  age: string,
  gender: string
): RankingsLevel {
  const normalizedAge = age?.trim().toLowerCase();
  const normalizedGender = gender?.trim().toLowerCase();

  const level = rankingsLevels(year).find(
    (l) => l.age === normalizedAge && l.gender === normalizedGender
  );

  if (!level) {
    const valid = rankingsLevels(year)
      .map((l) => `${l.gender} ${l.age}`)
      .join(", ");
    throw new Error(
      `No rankings level for age "${age}" and gender "${gender}". Valid combinations: ${valid}`
    );
  }

  return level;
}

/** True for levels whose MHR table omits the leading rank column. */
export function omitsRankColumn(level: RankingsLevel): boolean {
  return level.age === "9u" || level.age === "10u";
}

export const element1 = "table";
export const element2 = "tr:has(td)";

export const rkInfoBaseElement = "div.flex.flex-col.py-2";
export const locationBaseElement = "div.bg-primary.text-primary-foreground";
