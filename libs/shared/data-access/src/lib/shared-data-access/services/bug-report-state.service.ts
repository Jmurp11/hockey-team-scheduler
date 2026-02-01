import { Injectable, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { ContactFormResponse, ContactService } from './contact.service';

@Injectable({ providedIn: 'root' })
export class BugReportStateService {
  private contactService = inject(ContactService);

  loading = signal(false);

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  submit(): Observable<ContactFormResponse> | null {
    if (this.form.invalid) {
      return null;
    }

    this.loading.set(true);

    const { email, subject, message } = this.form.getRawValue();

    return this.contactService
      .sendContactForm({
        email,
        subject: `[Bug Report] ${subject}`,
        message,
      })
      .pipe(
        tap({
          next: () => {
            this.loading.set(false);
            this.form.reset();
          },
          error: () => {
            this.loading.set(false);
          },
        }),
      );
  }

  reset(): void {
    this.form.reset();
  }
}
