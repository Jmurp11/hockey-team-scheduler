import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class LeagueService {
  private http = inject(HttpClient);

  leagues() {
    return this.http.get(`${environment.apiUrl}/leagues`);
  }
}
