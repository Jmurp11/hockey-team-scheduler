
import { zodTextFormat } from 'openai/helpers/zod';
import { supabase } from "./supabase";
import { TournamentProps } from "./types";

export async function findTournaments(props: TournamentProps) {
    const existingTournaments = await supabase
      .from('tournaments')
      .select('*')
      .match(props);

    if (existingTournaments.error) {
      console.error(
        'Error checking existing tournaments:',
        existingTournaments.error,
      );
      throw new Error('Could not check existing tournaments');
    }
    const response = await this.client.responses.create({
      model: 'gpt-5-mini',
      tools: [{ type: 'web_search' }],
      input: this.generateTournamentPrompt(props),
      text: {
        format: zodTextFormat(this.tournamentResponse, 'tournaments'),
      },
    });

    const output = JSON.parse(response.output_text).tournaments;

    const { error } = await supabase.from('tournaments').insert(
      output.map((tournament: any) => ({
        name: tournament.name,
        location: tournament.location,
        start_date: tournament.startDate,
        end_date: tournament.endDate,
        registration_link: tournament.registrationLink,
        age: props.age,
        level: props.level,
      })),
    );

    if (output.length === 0) {
      console.warn('No tournaments found');
      return existingTournaments.data;
    }

    console.log({ output });
    return [...output, ...existingTournaments.data];
  }

export function generateTournamentPrompt(props: TournamentProps): string {
  return `
You are an automated web scraping and data extraction agent.

Your task: Find **real, upcoming youth hockey tournaments** that meet these parameters:
- Location: within ${props.maxDistance} miles of ${props.location}.
- Age group: ${props.age}.
- Skill level: ${props.level} (AAA, AA, A, or similar).

Follow these strict rules:
1. Use web_search to find tournaments from **official or authoritative sources only**, including:
   - https://www.hockeyfinder.com/tournaments
   - https://www.nickelcityhockey.com
   - https://www.defenderhockeytournaments.com
   - https://www.myhockeyrankings.com
   - https://www.sportsengine.com
   - https://www.tourneycentral.com
   - https://200x85.com
   - https://silverstick.org
   - league or association official websites
2. Ignore news, past tournaments, or unrelated events.
3. Include only tournaments that are open for registration or scheduled for the current or upcoming season.
4. Each tournament must include:
   - "name": official tournament name
   - "city": city
   - "state": state/province
   - "country": country
   - "rink": specific rink or venue name, or null if unknown
   - "startDate": start date if available (ISO format preferred)
   - "endDate": end date if available (ISO format preferred)
   - "level": array of levels offered (e.g. ["AAA", "AA"])
   - "age": array of eligible age groups (e.g. ["12U", "14U"])
   - "registrationURL": direct link to registration or tournament info page
   - "latitude": latitude coordinate of the tournament location, or null if unknown
   - "longitude": longitude coordinate of the tournament location, or null if unknown

Output must be **strictly valid JSON** in the following format:

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
    "latitude": "number | null",
    "longitude": "number | null"
  }
]

If no tournaments are found, return an empty array: []
Do not include explanations or commentary.
`;
}
