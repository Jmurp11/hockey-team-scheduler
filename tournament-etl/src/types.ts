export interface TournamentProps {
  location: string;
  locationType?: string;
}

/**
 * A tournament as produced by the LLM extraction and accepted by the
 * `p_save_tournaments` stored procedure.
 *
 * This mirrors the `tournaments` table, which stores a single `location` string
 * rather than separate city/state/country columns. `latitude`/`longitude` are
 * RPC inputs only — the table persists them as the PostGIS `geographic_point`
 * column, so they do not come back on rows read via `getTournaments`.
 *
 * Every field the model may omit is nullable. The previous declaration required
 * non-null `level`, `age`, `latitude`, and `longitude`, and declared
 * `city`/`state`/`country` columns that do not exist, so it described neither
 * side of the boundary it sat on.
 */
export interface Tournament {
  name: string;
  location: string;
  description: string;
  rink: string | null;
  startDate: string;
  endDate: string;
  level: string[] | null;
  age: string[] | null;
  registrationUrl: string;
  latitude: number | null;
  longitude: number | null;
}

/** A tournament row as read back from the `tournaments` table. */
export interface ExistingTournament {
  registrationUrl: string;
}

/** Per-run counts, surfaced to the CI job summary. */
export interface ETLResult {
  /** Unique tournaments after the multi-pass union. */
  found: number;
  alreadyPresent: number;
  inserted: number;
  sharedUrlGroups: number;
  /**
   * Raw count from each search pass, before the union. Model yield varies
   * widely between identical calls, so a run that finds little is only
   * interpretable with the per-pass spread visible.
   */
  passYields: number[];
}
