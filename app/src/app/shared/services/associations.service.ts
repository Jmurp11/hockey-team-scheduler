import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class AssociationService {
  private http = inject(HttpClient);

  associations() {
    return this.http.get(`${environment.apiUrl}/associations`);
  }
}
