import { leagues } from "../leagues/leagues";
import {
  element1 as element1_lg,
  element2 as element2_lg,
} from "../leagues/leagues.constants";
import { base_url, leagues as lg, rankings as rks } from "../main.constants";
import { formatUrl, rankings } from "../rankings/rankings";
import { RankingsLevel } from "../rankings/rankings.constants";
import { handleBadLocationData, isCanada } from "./normalize";
import { callStoredProcedure } from "./supabase";

export interface LeaguesResult {
  leagues: number;
}

export interface RankingsResult {
  age: string;
  gender: string;
  girlsOnly: boolean;
  teams: number;
  ratedTeams: number;
  associations: number;
  unknownLocations: number;
  /** True when nothing was written because MHR has no ratings for the season yet. */
  skipped: boolean;
}

export async function insertLeagues(): Promise<LeaguesResult> {
  try {
    const lgs = await leagues(base_url + lg, element1_lg, element2_lg);
    await callStoredProcedure("p_batch_leagues", { _leagues: lgs.leagues });
    return { leagues: lgs.leagues.length };
  } catch (error) {
    throw new Error(
      `Failed to insert leagues: ${(error as Error).message}`,
      { cause: error }
    );
  }
}

export async function insertRankings(
  level: RankingsLevel,
  options: { allowZeroRatings?: boolean } = {}
): Promise<RankingsResult> {
  try {
    const url = formatUrl(base_url + rks, level);
    const fetchResult = await rankings(url, level);

    // Derived from the level's own gender rather than its position in the
    // rankingsLevels array, which is what the CI matrix used to depend on.
    const girlsOnly = level.gender === "girls";

    const ranks: Record<string, unknown>[] = [];
    const associations: Record<string, unknown>[] = [];
    let unknownLocations = 0;

    for (const rank of fetchResult.rankings) {
      const location = handleBadLocationData(rank);
      if (location.city === "UNKNOWN" || location.state === "UNKNOWN") {
        unknownLocations++;
      }

      ranks.push({
        age: rank.age,
        record: rank.record,
        rating: rank.rating,
        agd: rank.avg_goal_diff,
        sched: rank.schedule,
        association: rank.association,
        team_name: rank.team_name,
        girls_only: girlsOnly,
        ...location,
      });

      if (rank.association) {
        associations.push({
          name: rank.association,
          ...location,
          country: isCanada(location.state),
          orgLeagues: rank.leagues,
          association_url: rank.associationUrl || null,
        });
      }
    }

    // MHR publishes next season's rosters with zero ratings from roughly April
    // until mid-September (see .claude/context/challenges.md). Loading those
    // would overwrite every real rating with 0, so refuse by default and make
    // the caller opt in explicitly.
    const ratedTeams = ranks.filter(
      (r) => typeof r.rating === "number" && r.rating > 0
    ).length;

    if (ratedTeams === 0 && !options.allowZeroRatings) {
      // A normal seasonal state, not a failure: skip cleanly so the weekly
      // schedule does not raise ~20 weeks of false alarms every offseason.
      console.log(
        `[Rankings] Skipping ${level.gender} ${level.age}: all ${ranks.length} ` +
          `teams have a rating of 0, so MHR has not published ratings for season ` +
          `${level.year} yet. Writing them would overwrite existing ratings with ` +
          `zeros. Use --allow-zero-ratings to load roster data anyway.`
      );

      return {
        age: level.age,
        gender: level.gender,
        girlsOnly,
        teams: ranks.length,
        ratedTeams: 0,
        associations: associations.length,
        unknownLocations,
        skipped: true,
      };
    }

    if (ratedTeams < ranks.length / 2 && !options.allowZeroRatings) {
      console.warn(
        `[Rankings] Only ${ratedTeams}/${ranks.length} teams have a non-zero rating.`
      );
    }

    await callStoredProcedure("p_batch_orgs", { _orgs: associations });

    console.log(
      `Inserting ${ranks.length} records for ${level.gender} ${level.age}`
    );

    await callStoredProcedure("p_batch_rankings", {
      _rankings: ranks,
    });

    return {
      age: level.age,
      gender: level.gender,
      girlsOnly,
      teams: ranks.length,
      ratedTeams,
      associations: associations.length,
      unknownLocations,
      skipped: false,
    };
  } catch (error) {
    throw new Error(
      `Failed to insert rankings for ${level.gender} ${level.age}: ${
        (error as Error).message
      }`,
      { cause: error }
    );
  }
}

