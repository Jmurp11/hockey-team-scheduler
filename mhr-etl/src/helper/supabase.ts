import { createClient } from "@supabase/supabase-js";
import { env } from "node:process";
import "./env";

const supabaseUrl = env.SUPABASE_URL || "";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

// Fail fast with an actionable message. An empty key otherwise surfaces as an
// opaque Supabase error deep inside a run that has already spent minutes scraping.
if (!supabaseUrl || !supabaseKey) {
  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !supabaseKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
      `See mhr-etl/.env.example. These writes need the service-role key, not the publishable key.`
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function callStoredProcedure(storedProc: string, params: any) {
  const { data, error } = await supabase.rpc(storedProc, params);

  if (error) {
    throw new Error(`RPC ${storedProc} failed: ${error.message}`, {
      cause: error,
    });
  }

  return data;
}
