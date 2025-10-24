import { createClient } from "@supabase/supabase-js";
import { env } from "node:process";
import { Tournament } from "./types";
import "dotenv/config";


const supabaseUrl = env.SUPABASE_URL || "";
const supabaseKey = env.SUPABASE_API_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

export function getTournaments(tournaments: Tournament[]) {
  try {
    return supabase
      .from("tournaments")
      .select("*")
      .in(
        "registrationURL",
        tournaments.map((t) => t.registrationURL)
      );
  } catch (error) {
    throw new Error("Could not get tournaments: " + (error as Error).message);
  }
}

export function insertTournaments(tournaments: Tournament[]) {
  try {
    return supabase.from("tournaments").insert(tournaments);
  } catch (error) {
    throw new Error(
      "Could not insert tournaments: " + (error as Error).message
    );
  }
}
