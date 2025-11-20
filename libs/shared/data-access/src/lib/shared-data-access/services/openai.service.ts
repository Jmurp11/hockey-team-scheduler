import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

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

@Injectable({ providedIn: 'root' })
export class OpenAiService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  contactScheduler(params: SchedulerProps) {
    return this.http.post(`${this.config.apiUrl}/open-ai/contact-scheduler`, 
      params,
    );
  }

  findTournaments(params: TournamentProps) {
    return this.http.post(`${this.config.apiUrl}/open-ai/find-tournaments`, 
      params,
    );
  }
}
