/**
 * Exercises the real supabase module against a mocked supabase-js client.
 *
 * The previous version of this file re-implemented getTournaments and
 * insertTournaments inside `jest.mock('./supabase', ...)`, so it asserted
 * against a copy of the code rather than the code itself — the
 * `registration_link` dedup bug passed these tests for that reason.
 */

const mockIn = jest.fn();
const mockSelect = jest.fn((_columns: string) => ({ in: mockIn }));
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));
const mockRpc = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

import { makeTournament } from "./fixtures";
import { getTournaments, insertTournaments } from "./supabase";

describe("getTournaments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIn.mockResolvedValue({ data: [], error: null });
  });

  it("queries the tournaments table by registrationUrl", async () => {
    const tournaments = [
      makeTournament({ registrationUrl: "https://example.com/a" }),
      makeTournament({ registrationUrl: "https://example.com/b" }),
    ];

    await getTournaments(tournaments);

    expect(mockFrom).toHaveBeenCalledWith("tournaments");
    expect(mockSelect).toHaveBeenCalledWith("registrationUrl");
    expect(mockIn).toHaveBeenCalledWith("registrationUrl", [
      "https://example.com/a",
      "https://example.com/b",
    ]);
  });

  it("returns the matching rows", async () => {
    mockIn.mockResolvedValue({
      data: [{ registrationUrl: "https://example.com/a" }],
      error: null,
    });

    const result = await getTournaments([makeTournament()]);

    expect(result).toEqual([{ registrationUrl: "https://example.com/a" }]);
  });

  it("short-circuits without querying when given no tournaments", async () => {
    const result = await getTournaments([]);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws when supabase reports an error", async () => {
    // supabase-js returns errors rather than throwing. This was previously
    // unchecked, so a failed query looked like "no existing tournaments" and
    // the caller re-inserted the whole batch.
    mockIn.mockResolvedValue({
      data: null,
      error: { message: 'column "nope" does not exist' },
    });

    await expect(getTournaments([makeTournament()])).rejects.toThrow(
      /Could not get tournaments: column "nope" does not exist/
    );
  });

  it("returns an empty array when data is null but no error is reported", async () => {
    mockIn.mockResolvedValue({ data: null, error: null });

    await expect(getTournaments([makeTournament()])).resolves.toEqual([]);
  });

  it("skips tournaments with no registrationUrl", async () => {
    await getTournaments([
      makeTournament({ registrationUrl: "https://example.com/a" }),
      makeTournament({ registrationUrl: "" }),
    ]);

    expect(mockIn).toHaveBeenCalledWith("registrationUrl", [
      "https://example.com/a",
    ]);
  });
});

describe("insertTournaments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("calls p_save_tournaments with the batch", async () => {
    const tournaments = [makeTournament()];

    await insertTournaments(tournaments);

    expect(mockRpc).toHaveBeenCalledWith("p_save_tournaments", {
      _tournaments: tournaments,
    });
  });

  it("returns the RPC data", async () => {
    await expect(insertTournaments([makeTournament()])).resolves.toEqual({
      success: true,
    });
  });

  it("passes through tournaments with null optional fields", async () => {
    const sparse = [
      makeTournament({
        rink: null,
        level: null,
        age: null,
        latitude: null,
        longitude: null,
      }),
    ];

    await insertTournaments(sparse);

    expect(mockRpc).toHaveBeenCalledWith("p_save_tournaments", {
      _tournaments: sparse,
    });
  });

  it("throws when the RPC reports an error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "unique constraint violation" },
    });

    await expect(insertTournaments([makeTournament()])).rejects.toThrow(
      /Could not insert tournaments: unique constraint violation/
    );
  });
});
