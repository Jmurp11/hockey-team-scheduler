import { findTournamentsMultiPass } from "./open-ai";
import { getTournaments, insertTournaments } from "./supabase";
import { ETLResult, Tournament, TournamentProps } from "./types";

export interface RunETLOptions {
  passes?: number;
}

/**
 * Report tournaments that share a registrationUrl within a single batch.
 *
 * The model sometimes returns a directory page (e.g.
 * hockeyfinder.com/tournaments) instead of a specific registration link, so
 * several distinct tournaments collapse onto one key. Dedup cannot distinguish
 * those, so surface them rather than silently merging or dropping them.
 */
function reportSharedUrls(tournaments: Tournament[]): number {
  const byUrl = new Map<string, string[]>();

  for (const t of tournaments) {
    if (!t.registrationUrl) continue;
    const names = byUrl.get(t.registrationUrl) ?? [];
    names.push(t.name);
    byUrl.set(t.registrationUrl, names);
  }

  const shared = [...byUrl.entries()].filter(([, names]) => names.length > 1);

  for (const [url, names] of shared) {
    console.warn(
      `[Dedup] ${names.length} tournaments share registrationUrl ${url} — ` +
        `likely a listing page rather than a registration link: ${names.join(", ")}`
    );
  }

  return shared.length;
}

export async function runETL(
  props: TournamentProps,
  options: RunETLOptions = {}
): Promise<ETLResult> {
  try {
    const { tournaments: found, passYields } = await findTournamentsMultiPass(
      props,
      options
    );
    console.log(
      `[ETL] Model returned ${found.length} unique tournaments ` +
        `across ${passYields.length} passes (${passYields.join(", ")})`
    );

    const sharedUrlGroups = reportSharedUrls(found);

    const existing = await getTournaments(found);
    const existingUrls = new Set(existing.map((e) => e.registrationUrl));

    // Compare against `registrationUrl`, the column that actually exists.
    // This previously read `ft.registration_link`, which is always undefined on
    // the returned rows, so the filter matched nothing and every run re-sent the
    // full batch.
    const newTournaments = found.filter(
      (t) => !existingUrls.has(t.registrationUrl)
    );

    console.log(
      `[ETL] ${existingUrls.size} already present, ${newTournaments.length} new`
    );

    if (newTournaments.length > 0) {
      await insertTournaments(newTournaments);
    } else {
      console.log("[ETL] Nothing new to insert");
    }

    return {
      found: found.length,
      alreadyPresent: existingUrls.size,
      inserted: newTournaments.length,
      sharedUrlGroups,
      passYields,
    };
  } catch (error) {
    throw new Error(`ETL process failed: ${(error as Error).message}`, {
      cause: error,
    });
  }
}
