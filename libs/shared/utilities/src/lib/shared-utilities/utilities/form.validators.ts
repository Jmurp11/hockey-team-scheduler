import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator for opponent field that accepts arrays, objects, or strings with minimum length
 * Used in game forms where opponent can be selected from API data or entered as text
 */
export function opponentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // If it's an array or object (from API), it's valid
    if (Array.isArray(value) && value.length > 0) {
      return null;
    }

    // If it's an object with properties, it's valid
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return null;
    }

    // If it's a string, check minimum length
    if (typeof value === 'string' && value.length >= 3) {
      return null;
    }

    // Otherwise, it's invalid
    return { invalidOpponent: true };
  };
}
