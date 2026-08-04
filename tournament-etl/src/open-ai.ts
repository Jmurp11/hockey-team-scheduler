import { zodTextFormat } from "openai/helpers/zod";
import { Tournament, TournamentProps } from "./types";
import { OpenAI } from "openai/client";
import { ZodType, z } from "zod/v3";

const tournamentResponse: ZodType = z.object({
  tournaments: z.array(
    z.object({
      name: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      registrationUrl: z.string().describe("URL to register"),
      description: z.string(),
      rink: z.string().nullable(),
      age: z.array(z.string()).nullable(),
      level: z.array(z.string()).nullable(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
    })
  ),
});
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 2000;
/**
 * Yield is high-variance: five identical calls for Massachusetts returned
 * 0, 0, 1, 2, 3 tournaments. The pipeline is healthy — the model searches,
 * opens pages, and returns schema-valid JSON; it just finds little on any
 * given call. Independent passes are unioned so one empty pass is survivable.
 */
const DEFAULT_PASSES = 3;
/** How far ahead to look. Tournaments are posted up to a season in advance. */
const SEARCH_WINDOW_MONTHS = 12;
// A web_search + reasoning call is slow, but not this slow. Without a bound a
// hung request would sit until the workflow's own timeout.
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
}

export async function findTournaments(
  props: TournamentProps,
  options: RetryOptions = {}
): Promise<Tournament[]> {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const initialDelayMs = options.initialDelayMs ?? INITIAL_RETRY_DELAY_MS;

  const client = new OpenAI({ timeout: REQUEST_TIMEOUT_MS });
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.responses.create({
        model: "gpt-5-mini",
        tools: [{ type: "web_search" }],
        input: generateTournamentPrompt(props),
        // "low" stopped after ~4 searches and frequently returned nothing.
        reasoning: { effort: "medium" },
        text: {
          format: zodTextFormat(tournamentResponse, "tournaments"),
        },
      });

      return parseTournaments(response.output_text);
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) break;

      // Retrying is safe: the call has no side effects, and dedup runs after.
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[OpenAI] Attempt ${attempt}/${maxAttempts} failed for ` +
          `"${props.location}": ${lastError.message}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw new Error(
    `Could not find tournaments after ${maxAttempts} attempts: ${lastError?.message}`,
    { cause: lastError }
  );
}

export interface MultiPassOptions extends RetryOptions {
  passes?: number;
}

export interface MultiPassResult {
  tournaments: Tournament[];
  /** Raw count per pass, before the union. Keeps the variance visible. */
  passYields: number[];
}

/**
 * Identity key for the in-batch union.
 *
 * Keyed on `name` + `startDate` to match `p_save_tournaments`'s
 * `ON CONFLICT (name, "startDate")`, deliberately NOT on `registrationUrl`:
 * the model often returns a listing page (e.g. `200x85.com/tournaments/`) that
 * several genuinely distinct tournaments share, so that key would collapse
 * real events into one.
 *
 * This is in-batch only. The client-side "already present" filter in
 * `tournaments.ts` still keys on `registrationUrl` — reconciling those two is a
 * separate, deliberately deferred decision.
 */
function identityKey(t: Tournament): string {
  return `${t.name?.trim().toLowerCase()}|${t.startDate}`;
}

/**
 * Run several independent searches and union the results.
 *
 * A single call is one sample of a high-variance process, so a run could find
 * nothing purely by chance. Passes run sequentially rather than concurrently —
 * each already issues many web searches, and the monthly job has no deadline
 * pressure.
 *
 * A pass that fails after its own retries is logged and skipped; partial
 * results are still worth loading. Only an all-passes-failed run throws.
 */
export async function findTournamentsMultiPass(
  props: TournamentProps,
  options: MultiPassOptions = {}
): Promise<MultiPassResult> {
  const passes = options.passes ?? DEFAULT_PASSES;
  const byIdentity = new Map<string, Tournament>();
  const passYields: number[] = [];
  const failures: Error[] = [];

  for (let pass = 1; pass <= passes; pass++) {
    try {
      const found = await findTournaments(props, options);
      passYields.push(found.length);

      for (const tournament of found) {
        const key = identityKey(tournament);
        if (!byIdentity.has(key)) byIdentity.set(key, tournament);
      }

      console.log(
        `[OpenAI] Pass ${pass}/${passes} for "${props.location}": ` +
          `${found.length} found, ${byIdentity.size} unique so far`
      );
    } catch (error) {
      failures.push(error as Error);
      passYields.push(0);
      console.warn(
        `[OpenAI] Pass ${pass}/${passes} for "${props.location}" failed: ` +
          `${(error as Error).message}. Continuing with remaining passes.`
      );
    }
  }

  if (failures.length === passes) {
    throw new Error(
      `All ${passes} passes failed for "${props.location}". ` +
        `Last error: ${failures[failures.length - 1]?.message}`,
      { cause: failures[failures.length - 1] }
    );
  }

  return { tournaments: [...byIdentity.values()], passYields };
}

/**
 * Parse and normalize the model's response.
 *
 * A malformed payload previously threw a bare SyntaxError from `JSON.parse`,
 * giving no indication that the model was at fault. Fail with the offending
 * output attached so a retry can be judged from the logs.
 */
export function parseTournaments(outputText: string): Tournament[] {
  let payload: unknown;

  try {
    payload = JSON.parse(outputText);
  } catch (error) {
    throw new Error(
      `Model returned invalid JSON: ${(error as Error).message}. ` +
        `First 200 chars: ${String(outputText).slice(0, 200)}`,
      { cause: error }
    );
  }

  const tournaments = (payload as { tournaments?: unknown })?.tournaments;

  if (!Array.isArray(tournaments)) {
    throw new Error(
      `Model response had no "tournaments" array (got ${typeof tournaments})`
    );
  }

  return tournaments.map((tournament: any) => ({
    name: tournament.name,
    location: tournament.location,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    registrationUrl: tournament.registrationUrl,
    description: tournament.description,
    rink: tournament.rink ?? null,
    age: tournament.age ?? null,
    level: tournament.level ?? null,
    latitude: tournament.latitude ?? null,
    longitude: tournament.longitude ?? null,
  }));
}

export function generateTournamentPrompt(
  props: TournamentProps,
  now: Date = new Date()
): string {
  const windowEnd = new Date(now);
  windowEnd.setMonth(windowEnd.getMonth() + SEARCH_WINDOW_MONTHS);

  const today = now.toISOString().slice(0, 10);
  const until = windowEnd.toISOString().slice(0, 10);

  return `
You are an automated web search and data extraction agent that acts like a deterministic web scraper.

Your goal: Find **real, upcoming youth hockey tournaments** that match the following parameters:
- Within the ${props.locationType} of ${props.location}.
- With a **startDate between ${today} and ${until}**. Today is ${today}.
  Do not rely on a vague notion of "this season" — use these dates.

Follow these strict rules:

1. **Search Scope**
   - Use web_search to locate tournament listings or registration pages from **official or authoritative sources only**, including:
     - https://www.hockeyfinder.com/tournaments
     - https://www.nickelcityhockey.com
     - https://www.defenderhockeytournaments.com
     - https://www.myhockeyrankings.com
     - https://www.sportsengine.com
     - https://www.tourneycentral.com
     - https://www.200x85.com
     - https://silverstick.org
     - Official league or association websites.
   - Prioritize pages that explicitly list **upcoming** or **currently open** tournaments.
   - **Work through the list — do not stop at the first source that returns results.**
     Check several of the sources above before answering. Returning an empty or near-empty
     result when these sites do list qualifying tournaments is a failure.

2. **Inclusion Criteria**
   - Include only **verified tournaments** whose startDate falls in the window above.
   - Return **every** qualifying tournament you can verify, not just a representative few.
   - Ignore:
     - Past or archived events.
     - News articles or pages without registration or date info.
     - Duplicate listings.

3. **Data Extraction Requirements**
   For each valid tournament, extract or infer the following fields:
   - "name": Official tournament name (required).
   - "location": City, State, Country (required).
   - "rink": Rink or venue name (required if available, else null).
   - "startDate": Start date (ISO format, YYYY-MM-DD).
   - "endDate": End date (ISO format, YYYY-MM-DD).
   - "registrationUrl": Link to **this specific tournament's** registration or event page.
     Prefer a per-event URL (one containing an event id or slug, e.g.
     ".../events/da991978-..." or ".../event/fall-prep-26/").
     **Do not return a directory or listing page** such as ".../tournaments/" that would be
     identical for every tournament on the site — those are used to identify records and a
     shared link makes distinct tournaments indistinguishable. If only a listing page
     exists, still return the tournament, but prefer the deepest event-specific link available.
   - "description": Tournament description

4. **Field Inference Rules (Required Completion)**
   Even if not explicitly listed, you must infer the following fields using reasonable context clues or common knowledge:

   - "level":  
     Derive from tournament descriptions or names (e.g. “AAA”, “AA”, “A”, “Tier I”, “Select”).  
     If not stated, default to null.

   - "age":  
     Infer age groups (e.g. “10U”, “12U”, “14U”, “16U”, “18U”) from titles, divisions, or categories.  
     If missing, leave null.

   - "latitude" and "longitude":  
     Derive approximate coordinates for the tournament's **city, state, and country**.  
     Use widely known public geolocation data (e.g. latitude/longitude of the city center).  
     Round to 4 decimal places.  
     If the city is unknown, set both to null.

   All fields must be included in each JSON object. None may be omitted.

5. **Output Format**
   - Return a single JSON **object** with a "tournaments" array, structured exactly like this:

\`\`\`json
{
  "tournaments": [
    {
      "name": "string",
      "location": "string",
      "rink": "string | null",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "level": ["AAA", "AA", "A"],
      "age": ["10U", "12U"],
      "registrationUrl": "https://...",
      "description": "string",
      "latitude": 42.1234,
      "longitude": -75.9876
    }
  ]
}
\`\`\`
`;
}
