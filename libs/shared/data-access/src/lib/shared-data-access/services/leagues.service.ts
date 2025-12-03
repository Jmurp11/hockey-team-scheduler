import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  leagues() {
    return this.http.get(`${this.config.apiUrl}/leagues`);
  }
}
