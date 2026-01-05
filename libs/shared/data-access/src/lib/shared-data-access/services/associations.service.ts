import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AssociationFull } from '@hockey-team-scheduler/shared-utilities';
import { SelectItem } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class AssociationsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  associations() {
    return this.http.get(`${this.config.apiUrl}/associations`);
  }

  getAssociation(id: number): Observable<AssociationFull> {
    return this.http.get<AssociationFull>(`${this.config.apiUrl}/associations/${id}`);
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
