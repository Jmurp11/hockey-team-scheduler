import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { setSelect } from '@hockey-team-scheduler/shared-utilities';
import { SelectItem } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class RinksService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  getRinks(): Observable<SelectItem[]> {
    return this.http
      .get(`${this.config.apiUrl}/rinks`)
      .pipe(
        map((rinks) =>
          (rinks as any[]).map((rink) => setSelect(rink.rink, rink)),
        ),
      );
  }
}
