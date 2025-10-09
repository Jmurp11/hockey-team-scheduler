import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class AssociationService {
  private http = inject(HttpClient);

  associations() {
    return this.http.get(`${environment.apiUrl}/associations`);
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
