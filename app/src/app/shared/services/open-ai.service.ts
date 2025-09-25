import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { environment } from '../../environments/environment';

export interface SchedulerProps {
  team: string;
  location: string;
}

export interface TournamentProps {
  maxDistance: number;
  age: string;
}
@Injectable()
export class OpenAiService {
  client = new OpenAI({ apiKey: environment.OPENAI_API_KEY, dangerouslyAllowBrowser: true });

  async contactScheduler(props: SchedulerProps) {
    const response = await this.client.responses.create({
      model: 'gpt-5-nano',
      input: `Give me the contact information for the ${props.team} youth hockey team that is based in ${props.location}`,
    });
    return response;
  }

  async findTournaments(props: TournamentProps) {
    const response = await this.client.responses.create({
      model: 'gpt-5-nano',
      input: `Find youth hockey tournaments within ${props.maxDistance} miles for ${props.age}U.`,
    });
    return response;
  }
}
