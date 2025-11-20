import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../config/app-config';

@Injectable()
export class AssociationService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  associations() {
    return this.http.get(`${this.config.apiUrl}/associations`);
  }

  getAssociations(): Observable<SelectItem[]> {
    return this.associations().pipe(
      map((associations) => {
        return (associations as any[]).map((association) => ({
          label: association.name,
          value: association.id,
        }));
      })
    );
  }
}
