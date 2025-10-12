/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { env } from 'node:process';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
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
      }),
    ),
  });

  tournamentResponse: ZodType = z.object({
    tournaments: z.array(
      z.object({
        name: z.string(),
        location: z.string(),
        date: z.string(),
        registrationLink: z.string().describe('URL to register'), // ← remove .url() or format:'uri'
      }),
    ),
  });

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
    });
  }
  async contactScheduler(props: SchedulerProps) {
    const response = await this.client.responses.create({
      model: 'gpt-5-mini',
      tools: [{ type: 'web_search' }],
      input: `Return the contact information for the ${props.team} youth hockey team (${props.location}) manager.`,
      text: {
        format: zodTextFormat(this.managerResponse, 'managers'),
      },
    });
    return response;
  }

  async findTournaments(props: TournamentProps) {
    const response = await this.client.responses.create({
      model: 'gpt-5-mini',
      tools: [{ type: 'web_search' }],
      input: `Use the web_search tool to find up-to-date youth hockey tournaments
within ${props.maxDistance} miles of the ${props.userAssociation} for
the ${props.age} age group and ${props.level} level.
Return real tournaments with location, date, and registration links.`,
      text: {
        format: zodTextFormat(this.tournamentResponse, 'tournaments'),
      },
    });
    console.log({
      request: `Return all youth hockey tournaments within ${props.maxDistance} miles of the ${props.userAssociation} for the ${props.age} age group and ${props.level} level.`,
    });
    console.log({ output: JSON.stringify(response, null, 2) });
    console.log({ response });
    return null;
  }
}
