import { base_url, rankings as rks } from "../main.constants";
import { formatUrl } from "./rankings";
import { findRankingsLevel } from "./rankings.constants";

describe("formatUrl", () => {
  const base = base_url + rks;

  it("builds the standard rankings URL from year and list id", () => {
    const url = formatUrl(base, findRankingsLevel(2026, "12u", "boys"));
    expect(url).toBe("https://myhockeyrankings.com/rank.php?y=2026&v=124");
  });

  it("adds the a=1 parameter only for boys 9u", () => {
    // MHR needs the extra flag for this one list; everything else must not have it.
    expect(formatUrl(base, findRankingsLevel(2026, "9u", "boys"))).toBe(
      "https://myhockeyrankings.com/rank.php?y=2026&a=1&v=121"
    );
    expect(formatUrl(base, findRankingsLevel(2026, "10u", "boys"))).not.toContain(
      "a=1"
    );
    expect(formatUrl(base, findRankingsLevel(2026, "10u", "girls"))).not.toContain(
      "a=1"
    );
  });

  it("uses the girls list id for a shared age", () => {
    expect(formatUrl(base, findRankingsLevel(2026, "16u", "girls"))).toBe(
      "https://myhockeyrankings.com/rank.php?y=2026&v=2042"
    );
  });

  it("reflects the requested season year", () => {
    expect(formatUrl(base, findRankingsLevel(2027, "14u", "boys"))).toContain(
      "y=2027"
    );
  });
});
