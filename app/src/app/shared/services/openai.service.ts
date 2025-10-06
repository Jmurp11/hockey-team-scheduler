import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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
  private http = inject(HttpClient);

  contactScheduler(params: SchedulerProps) {
    return this.http.post(`${environment.apiUrl}/open-ai/contact-scheduler`, 
      params,
    );
  }

  findTournaments(params: SchedulerProps) {
    return this.http.post(`${environment.apiUrl}/open-ai/find-tournaments`, 
      params,
    );
  }
}
