jest.mock("./supabase", () => ({
  getTournaments: jest.fn(),
  insertTournaments: jest.fn(),
}));

jest.mock("./open-ai");

import { makeTournament } from "./fixtures";
import * as openAI from "./open-ai";
import * as supabase from "./supabase";
import { runETL } from "./tournaments";
import { Tournament, TournamentProps } from "./types";

const props: TournamentProps = { location: "New York", locationType: "states" };

const found = jest.mocked(openAI.findTournamentsMultiPass);
const existing = jest.mocked(supabase.getTournaments);
const insert = jest.mocked(supabase.insertTournaments);

/**
 * Stub the multi-pass search with the union it would have produced.
 * These tests cover what `runETL` does with the results; the union and
 * per-pass failure handling are `open-ai.spec.ts`'s job.
 */
function resolveFound(...tournaments: Tournament[]) {
  found.mockResolvedValue({ tournaments, passYields: [tournaments.length] });
}

const tournamentA = makeTournament({
  name: "Tournament A",
  registrationUrl: "https://example.com/a",
});
const tournamentB = makeTournament({
  name: "Tournament B",
  registrationUrl: "https://example.com/b",
});

function insertedBatch() {
  return insert.mock.calls[0][0];
}

describe("runETL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    insert.mockResolvedValue({ success: true });
  });

  afterEach(() => jest.restoreAllMocks());

  it("inserts everything on a first run", async () => {
    resolveFound(tournamentA, tournamentB);
    existing.mockResolvedValue([]);

    const result = await runETL(props);

    expect(insertedBatch()).toHaveLength(2);
    expect(result).toMatchObject({ found: 2, alreadyPresent: 0, inserted: 2 });
  });

  it("inserts nothing on an immediate second run", async () => {
    // The regression this change exists for: the filter compared
    // `ft.registration_link`, which is undefined on every row, so a rerun
    // re-sent the entire batch.
    resolveFound(tournamentA, tournamentB);
    existing.mockResolvedValue([
      { registrationUrl: "https://example.com/a" },
      { registrationUrl: "https://example.com/b" },
    ]);

    const result = await runETL(props);

    expect(result.inserted).toBe(0);
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts only the tournaments that are not already stored", async () => {
    resolveFound(tournamentA, tournamentB);
    existing.mockResolvedValue([{ registrationUrl: "https://example.com/a" }]);

    const result = await runETL(props);

    expect(insertedBatch()).toHaveLength(1);
    expect(insertedBatch()[0].registrationUrl).toBe("https://example.com/b");
    expect(result).toMatchObject({ alreadyPresent: 1, inserted: 1 });
  });

  it("does not treat a row keyed on the old column name as a match", async () => {
    // Guards against reintroducing `registration_link`, which is not a column
    // on this table.
    resolveFound(tournamentA);
    existing.mockResolvedValue([
      { registration_link: "https://example.com/a" } as never,
    ]);

    const result = await runETL(props);

    expect(result.inserted).toBe(1);
  });

  it("reports tournaments that share a registrationUrl", async () => {
    const warn = jest.spyOn(console, "warn");
    const listingUrl = "https://www.hockeyfinder.com/tournaments";

    resolveFound(
      makeTournament({ name: "First", registrationUrl: listingUrl }),
      makeTournament({ name: "Second", registrationUrl: listingUrl })
    );
    existing.mockResolvedValue([]);

    const result = await runETL(props);

    expect(result.sharedUrlGroups).toBe(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(listingUrl));
    // They are still inserted — dedup cannot tell them apart, so dropping one
    // would silently lose a real tournament.
    expect(insertedBatch()).toHaveLength(2);
  });

  it("handles the model returning no tournaments", async () => {
    resolveFound();
    existing.mockResolvedValue([]);

    const result = await runETL(props);

    expect(result).toMatchObject({ found: 0, inserted: 0 });
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([
    ["findTournamentsMultiPass", () => found.mockRejectedValue(new Error("OpenAI down"))],
    ["getTournaments", () => existing.mockRejectedValue(new Error("DB down"))],
    ["insertTournaments", () => insert.mockRejectedValue(new Error("RPC down"))],
  ])("wraps a failure from %s", async (_name, arrange) => {
    resolveFound(tournamentA);
    existing.mockResolvedValue([]);
    arrange();

    await expect(runETL(props)).rejects.toThrow(/ETL process failed:/);
  });

  it("preserves the original error as the cause", async () => {
    const original = new Error("DB down");
    resolveFound(tournamentA);
    existing.mockRejectedValue(original);

    await expect(runETL(props)).rejects.toMatchObject({ cause: original });
  });
});
