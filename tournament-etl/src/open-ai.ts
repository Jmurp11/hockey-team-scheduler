import { zodTextFormat } from "openai/helpers/zod";
import { TournamentProps } from "./types";
import { OpenAI } from "openai/client";

export async function findTournaments(props: TournamentProps) {
  const client = new OpenAI();
  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      tools: [{ type: "web_search" }],
      input: generateTournamentPrompt(props),
      text: {
        format: zodTextFormat(this.tournamentResponse, "tournaments"),
      },
    });

    const tournaments = JSON.parse(response.output_text).tournaments.map(
      (tournament: any) => ({
        name: tournament.name,
        location: tournament.location,
        start_date: tournament.startDate,
        end_date: tournament.endDate,
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
- Within ${props.location} Youth Hockey District".

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
     - General news articles or announcements without registration details.
     - Duplicates or repeated tournament names with the same dates.

3. **Data Requirements**
   - For each valid tournament, extract the following fields:
     - "name": Official tournament name.
     - "city": City where the tournament is held.
     - "state": State or province.
     - "country": Country.
     - "rink": Rink or venue name (null if not provided).
     - "startDate": Tournament start date (YYYY-MM-DD format).
     - "endDate": Tournament end date (YYYY-MM-DD format).
     - "level": Array of competitive levels offered (e.g. ["AAA", "AA"]).
     - "age": Array of eligible age groups (e.g. ["12U", "14U"]).
     - "registrationURL": Direct link to the official registration or event info page.

4. **Post-Processing (Derived Fields)**
   - After identifying the city, estimate:
     - "latitude": Approximate latitude of the tournament city.
     - "longitude": Approximate longitude of the tournament city.
   - These values should be **derived** using known geographic data, not scraped from the page.
   - Round to **4 decimal places** for consistency.
   - If coordinates cannot be determined, use 'null'.

5. **Output Format**
   - Return results as valid JSON matching the following structure:

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
    "registrationURL": "https://...",
    "latitude": 42.1234,
    "longitude": -75.9876
  }
]
`;
}
