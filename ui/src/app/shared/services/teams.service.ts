import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NearbyTeamsParams } from '../types/nearby-teams.type';

@Injectable()
export class TeamsService {
  private http = inject(HttpClient);

  teams(association?: number) {
    return this.http.get(`${environment.apiUrl}/teams`, {
      params: association ? { association: association.toString() } : {},
    });
  }

  nearbyTeams(params: NearbyTeamsParams) {
    return this.http.get(`${environment.apiUrl}/teams/nearbyTeams`, {
      params: {
        p_id: params.p_id.toString(),
        p_girls_only: params.p_girls_only,
        p_age: params.p_age,
        p_max_rating: params.p_max_rating.toString(),
        p_min_rating: params.p_min_rating.toString(),
        p_max_distance: params.p_max_distance.toString(),
      },
    });
  }

  getTeams(associationId: number): Observable<SelectItem[]> {
    return this.teams(associationId).pipe(
      map((teams) =>
        (teams as any[]).map((team) => ({ label: team.name, value: team.id }))
      )
    );
  }
}
