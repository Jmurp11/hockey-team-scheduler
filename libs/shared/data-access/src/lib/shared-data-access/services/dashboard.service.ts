import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DashboardSummary } from '@hockey-team-scheduler/shared-utilities';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  getDashboardSummary(teamId: number): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(
      `${this.config.apiUrl}/dashboard/summary`,
      {
        params: { teamId: teamId.toString() },
      },
    );
  }
}
