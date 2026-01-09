import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateTournamentDto,
  NearbyTournamentsParams,
  Tournament,
} from '@hockey-team-scheduler/shared-utilities';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class TournamentsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  tournaments() {
    return this.http.get(`${this.config.apiUrl}/tournaments`);
  }

  nearByTournaments(params: NearbyTournamentsParams) {
    return this.http.get(`${this.config.apiUrl}/tournaments/nearbyTournaments`, {
      params: {
        p_id: params.p_id.toString(),
      },
    });
  }

  /**
   * Creates a new tournament submission.
   * Used by tournament directors to submit their tournament for listing.
   */
  createTournament(dto: CreateTournamentDto) {
    return this.http.post<Tournament>(
      `${this.config.apiUrl}/tournaments`,
      dto,
    );
  }
}
