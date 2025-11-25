import { FormControl, FormGroup, Validators } from '@angular/forms';

/**
 * Initialize the login form with email and password fields
 */
export function initLoginForm(): FormGroup {
  return new FormGroup({
    email: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl(null, {
      validators: [Validators.required],
    }),
  });
}

/**
 * Initialize the magic link form with email field
 */
export function initMagicLinkForm(): FormGroup {
  return new FormGroup({
    email: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
  });
}
