import { createClient } from "@supabase/supabase-js";
import { env } from "node:process";
import { ExistingTournament, Tournament } from "./types";
import "dotenv/config";

const supabaseUrl = env.SUPABASE_URL || "";
const supabaseKey = env.SUPABASE_API_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Look up which of these tournaments are already stored, keyed on
 * `registrationUrl`.
 *
 * supabase-js reports errors in the result rather than throwing, so the
 * previous try/catch never saw them: a failed query surfaced as `data: null`,
 * which the caller read as "nothing exists yet" and re-inserted everything.
 * Check `error` explicitly instead.
 */
export async function getTournaments(
  tournaments: Tournament[]
): Promise<ExistingTournament[]> {
  const urls = tournaments.map((t) => t.registrationUrl).filter(Boolean);

  if (urls.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select("registrationUrl")
    .in("registrationUrl", urls);

  if (error) {
    throw new Error(`Could not get tournaments: ${error.message}`, {
      cause: error,
    });
  }

  return data ?? [];
}

export async function insertTournaments(tournaments: Tournament[]) {
  const { data, error } = await supabase.rpc("p_save_tournaments", {
    _tournaments: tournaments,
  });

  if (error) {
    throw new Error(`Could not insert tournaments: ${error.message}`, {
      cause: error,
    });
  }

  return data;
}
