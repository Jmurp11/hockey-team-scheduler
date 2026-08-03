/**
 * Guard behaviour for insertRankings. Supabase and the scraper are mocked so
 * this exercises the decision logic only — no network, no credentials.
 */

const mockCallStoredProcedure = jest.fn();
const mockRankings = jest.fn();

jest.mock("./supabase", () => ({
  callStoredProcedure: (...args: unknown[]) => mockCallStoredProcedure(...args),
}));

jest.mock("../rankings/rankings", () => ({
  formatUrl: () => "https://example.test/rank",
  rankings: (...args: unknown[]) => mockRankings(...args),
}));

import { insertRankings } from "./insert";
import { findRankingsLevel } from "../rankings/rankings.constants";

function team(name: string, rating: number) {
  return {
    team_name: name,
    rating,
    record: rating > 0 ? "10-2-1" : "0-0-0",
    avg_goal_diff: 0,
    schedule: 0,
    association: `${name} Association`,
    associationUrl: null,
    leagues: ["TEST"],
    location: "Boston, MA",
    age: "12u",
  };
}

describe("insertRankings zero-rating guard", () => {
  const level = findRankingsLevel(2026, "12u", "boys");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockCallStoredProcedure.mockResolvedValue(null);
  });

  afterEach(() => jest.restoreAllMocks());

  it("skips without writing when every rating is zero", async () => {
    // MHR publishes next season's rosters with 0.00 ratings from ~April until
    // mid-September. Loading those would overwrite real ratings with zeros.
    // This is a normal seasonal state, so it must skip rather than fail — a
    // throw here would raise ~20 weeks of false alarms every offseason.
    mockRankings.mockResolvedValue({
      rankings: [team("A", 0), team("B", 0), team("C", 0)],
    });

    const result = await insertRankings(level);

    expect(result.skipped).toBe(true);
    expect(result.teams).toBe(3);
    expect(result.ratedTeams).toBe(0);
    expect(mockCallStoredProcedure).not.toHaveBeenCalled();
  });

  it("writes zero-rated rosters when explicitly allowed", async () => {
    mockRankings.mockResolvedValue({ rankings: [team("A", 0), team("B", 0)] });

    const result = await insertRankings(level, { allowZeroRatings: true });

    expect(result.teams).toBe(2);
    expect(result.ratedTeams).toBe(0);
    expect(result.skipped).toBe(false);
    expect(mockCallStoredProcedure).toHaveBeenCalledWith(
      "p_batch_rankings",
      expect.anything()
    );
  });

  it("writes normally when ratings are present", async () => {
    mockRankings.mockResolvedValue({
      rankings: [team("A", 88.5), team("B", 91.2)],
    });

    const result = await insertRankings(level);

    expect(result.teams).toBe(2);
    expect(result.ratedTeams).toBe(2);
    expect(result.girlsOnly).toBe(false);

    const procs = mockCallStoredProcedure.mock.calls.map((c) => c[0]);
    expect(procs).toEqual(["p_batch_orgs", "p_batch_rankings"]);
  });

  it("passes through a partially rated set", async () => {
    mockRankings.mockResolvedValue({
      rankings: [team("A", 88.5), team("B", 0), team("C", 0)],
    });

    const result = await insertRankings(level);

    expect(result.ratedTeams).toBe(1);
    expect(mockCallStoredProcedure).toHaveBeenCalled();
  });

  it("derives girls_only from the level gender, not an array index", async () => {
    mockRankings.mockResolvedValue({ rankings: [team("A", 80)] });
    const girls = findRankingsLevel(2026, "19u", "girls");

    const result = await insertRankings(girls);

    expect(result.girlsOnly).toBe(true);
    const rankingsCall = mockCallStoredProcedure.mock.calls.find(
      (c) => c[0] === "p_batch_rankings"
    );
    expect(rankingsCall[1]._rankings[0].girls_only).toBe(true);
  });
});
