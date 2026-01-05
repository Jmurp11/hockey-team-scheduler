import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../config/app-config';

export interface ContactFormData {
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);
  private config: AppConfig = inject(APP_CONFIG);

  /**
   * Send a contact form submission to the application admin
   */
  sendContactForm(data: ContactFormData): Observable<ContactFormResponse> {
    return this.http.post<ContactFormResponse>(
      `${this.config.apiUrl}/email/contact`,
      data
    );
  }
}
