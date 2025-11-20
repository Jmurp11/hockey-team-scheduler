import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../config/app-config';

@Injectable()
export class LeagueService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  leagues() {
    return this.http.get(`${this.config.apiUrl}/leagues`);
  }
}
