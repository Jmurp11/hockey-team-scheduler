import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { NearbyTeamsParams, setSelect } from '@hockey-team-scheduler/shared-utilities';
import { APP_CONFIG } from '../config/app-config';

export interface TeamsParams {
  association?: number;
  age?: string;
}

@Injectable()
export class TeamsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  teams(teamParams: TeamsParams) {
    const params: any = {};
    if (teamParams.association) {
      params.association = teamParams.association.toString();
    }
    if (teamParams.age) {
      params.age = teamParams.age.toString();
    }
    return this.http.get(`${this.config.apiUrl}/teams`, {
      params,
    });
  }

  nearbyTeams(params: NearbyTeamsParams) {
    return this.http.get(`${this.config.apiUrl}/teams/nearbyTeams`, {
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

  getTeams(teamParams: TeamsParams): Observable<SelectItem[]> {
    return this.teams(teamParams).pipe(
      map((teams) =>
        (teams as any[]).map((team) => setSelect(team.name, team.id))
      )
    );
  }
}
