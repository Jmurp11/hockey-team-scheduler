import { zodTextFormat } from "openai/helpers/zod";
import { TournamentProps } from "./types";
import { OpenAI } from "openai/client";
import { ZodType, z } from "zod/v3";

const tournamentResponse: ZodType = z.object({
  tournaments: z.array(
    z.object({
      name: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      registrationLink: z.string().describe("URL to register"), // ← remove .url() or format:'uri'
    })
  ),
});
export async function findTournaments(props: TournamentProps) {
  const client = new OpenAI();
  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      tools: [{ type: "web_search" }],
      input: generateTournamentPrompt(props),
      text: {
        format: zodTextFormat(tournamentResponse, "tournaments"),
      },
    });

    const tournaments = JSON.parse(response.output_text).tournaments.map(
      (tournament: any) => ({
        name: tournament.name,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        registration_link: tournament.registrationLink,
        age: tournament.age,
        level: tournament.level,
        latitude: tournament.latitude,
        longitude: tournament.longitude,
      })
    );

    return tournaments;
  } catch (error) {
    throw new Error("Could not find tournaments: " + (error as Error).message);
  }
}

export function generateTournamentPrompt(props: TournamentProps): string {
  return `
You are an automated web search and data extraction agent that acts like a deterministic web scraper.

Your goal: Find **real, upcoming youth hockey tournaments** that match the following parameters:
- Within the "${props.location}" Youth Hockey District.

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

2. **Inclusion Criteria**
   - Include only **verified tournaments** that are scheduled for the current or upcoming season.
   - Ignore:
     - Past or archived events.
     - News articles or pages without registration or date info.
     - Duplicate listings.

3. **Data Extraction Requirements**
   For each valid tournament, extract or infer the following fields:
   - "name": Official tournament name (required).
   - "city": City where the tournament is held (required).
   - "state": State or province (required).
   - "country": Country (required).
   - "rink": Rink or venue name (required if available, else null).
   - "startDate": Start date (ISO format, YYYY-MM-DD).
   - "endDate": End date (ISO format, YYYY-MM-DD).
   - "registrationUrl": Direct link to the registration or info page.

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
   - Return only a valid JSON array structured exactly like this:

***json
[
  {
    "name": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "rink": "string | null",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "level": ["AAA", "AA", "A"],
    "age": ["10U", "12U"],
    "registrationUrl": "https://...",
    "latitude": 42.1234,
    "longitude": -75.9876
  }
]
`;
}
