import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NearbyTournamentsParams } from '@hockey-team-scheduler/shared-utilities';
import { APP_CONFIG } from '../config/app-config';

@Injectable()
export class TournamentsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  tournaments() {
    return this.http.get(`${this.config.apiUrl}/tournaments`);
  }

  nearByTournaments(params: NearbyTournamentsParams) {
    return this.http.get(`${this.config.apiUrl}/tournaments/nearbyTournaments`, {
      params: {
        p_id: params.p_id.toString()
      },
    });
  }
}
