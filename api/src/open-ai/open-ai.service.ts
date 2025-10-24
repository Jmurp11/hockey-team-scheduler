/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { env } from 'node:process';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { supabase } from 'src/supabase';
import { z, ZodType } from 'zod/v3';
export interface SchedulerProps {
  team: string;
  location: string;
}

export interface TournamentProps {
  maxDistance: number;
  age: string;
  level: string;
  userAssociation: string;
}

@Injectable()
export class OpenAiService {
  client: OpenAI;

  managerResponse: ZodType = z.object({
    managers: z.array(
      z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        sourceUrl: z
          .string()
          .describe('Source URL for the contact information'),
      }),
    ),
  });

  tournamentResponse: ZodType = z.object({
    tournaments: z.array(
      z.object({
        name: z.string(),
        location: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        registrationLink: z.string().describe('URL to register'), // ← remove .url() or format:'uri'
      }),
    ),
  });

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
    });
  }

  // TODO: needs refactor
  async contactScheduler(props: SchedulerProps) {
    const existingManager = await supabase
      .from('managers')
      .select('*')
      .ilike('team', `%${props.team}%`);

    if (existingManager.error) {
      console.error('Error checking existing manager:', existingManager.error);
      throw new Error('Could not check existing manager');
    }

    if (existingManager.data && existingManager.data.length > 0) {
      console.log(
        'Found existing manager, skipping OpenAI call:',
        existingManager.data,
      );
      return existingManager.data;
    }

    const response = await this.client.responses.create({
      model: 'gpt-5-mini',
      tools: [{ type: 'web_search' }],
      input: this.generateSchedulerPrompt(props),
      text: {
        format: zodTextFormat(this.managerResponse, 'managers'),
      },
    });

    console.log(JSON.stringify(response, null, 2));

    const managers = JSON.parse(response.output_text).managers.map(
      (manager) => ({
        name: manager.name.replace(/ cite.*/g, '').trim(),
        email: manager.email.replace(/ cite.*/g, '').trim(),
        phone: manager.phone.replace(/ cite.*/g, '').trim(),
        sourceUrl: manager.sourceUrl.replace(/ cite.*/g, '').trim(),
        team: props.team,
      }),
    );

    if (managers.length === 0) {
      console.warn('No managers found');
      return response;
    }

    const { error } = await supabase.from('managers').insert(managers);

    if (error) {
      console.error('Error inserting manager:', error);
      throw new Error('Could not save manager');
    }

    return response;
  }

  // TODO: this should be its own endpoint.  I need to prepopulate all of the tournaments in a separate process.
  async findTournaments(props: TournamentProps) {
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
        startDate: tournament.startDate,
        endDate: tournament.endDate,
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

  generateSchedulerPrompt(props: SchedulerProps): string {
    return `You are a contact information extraction agent.

  Search for the youth hockey team named "${props.team}" located in "${props.location}".
  Find official contact information for the **team manager** or **scheduler**.

  Search query example:
  "${props.team}" "${props.location}" hockey manager contact

  Return only verifiable information from official or authoritative sites.
  If found, return JSON exactly in this format:

  {
    "team": "${props.team}",
    "location": "${props.location}",
    "managerName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "sourceURL": "string | null"
  }

  If nothing is found, use null values.
`;
  }

  // TODO: userAssociation needs to be changed to location
  generateTournamentPrompt(props: TournamentProps): string {
    return `
You are an automated web scraping and data extraction agent.

Your task: Find **real, upcoming youth hockey tournaments** that meet these parameters:
- Location: within ${props.maxDistance} miles of the ${props.userAssociation}.
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
}
