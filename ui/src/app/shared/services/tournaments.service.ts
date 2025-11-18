import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { NearbyTournamentsParams } from '../types/nearby-tournaments.type';

@Injectable()
export class TournamentsService {
  private http = inject(HttpClient);

  tournaments() {
    return this.http.get(`${environment.apiUrl}/tournaments`);
  }

  nearByTournaments(params: NearbyTournamentsParams) {
    return this.http.get(`${environment.apiUrl}/tournaments/nearbyTournaments`, {
      params: {
        p_id: params.p_id.toString()
      },
    });
  }
}
