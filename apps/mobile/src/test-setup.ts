import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { FormControl, FormGroup, Validators } from '@angular/forms';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// Global mock for shared-utilities
// We use actual implementations for form-related functions to avoid Angular Forms compatibility issues
jest.mock('@hockey-team-scheduler/shared-utilities', () => ({
  // Use a simple implementation for getLastMessageTime
  getLastMessageTime: jest.fn((date: Date | string) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }),
  // Create a real FormGroup for initLoginForm to avoid Angular Forms compatibility issues
  initLoginForm: jest.fn(() => {
    return new FormGroup({
      email: new FormControl('', {
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        validators: [Validators.required],
      }),
    });
  }),
  // Use the real getFormControl implementation
  getFormControl: jest.fn((form: FormGroup, field: string) => {
    return form?.get(field) as FormControl;
  }),
}));
