import { FormControl, FormGroup } from '@angular/forms';
import { confirmPasswordValidator } from './password-match.validator';

describe('password-match.validator', () => {
  describe('confirmPasswordValidator', () => {
    it('should return null when passwords match', () => {
      const form = new FormGroup(
        {
          password: new FormControl('password123'),
          confirmPassword: new FormControl('password123'),
        },
        { validators: confirmPasswordValidator }
      );

      expect(form.errors).toBeNull();
    });

    it('should return mismatchPassword error when passwords do not match', () => {
      const form = new FormGroup(
        {
          password: new FormControl('password123'),
          confirmPassword: new FormControl('differentPassword'),
        },
        { validators: confirmPasswordValidator }
      );

      expect(form.errors).toEqual({ mismatchPassword: true });
    });

    it('should return null when both passwords are empty', () => {
      const form = new FormGroup(
        {
          password: new FormControl(''),
          confirmPassword: new FormControl(''),
        },
        { validators: confirmPasswordValidator }
      );

      expect(form.errors).toBeNull();
    });

    it('should return mismatchPassword error when one password is empty', () => {
      const form = new FormGroup(
        {
          password: new FormControl('password123'),
          confirmPassword: new FormControl(''),
        },
        { validators: confirmPasswordValidator }
      );

      expect(form.errors).toEqual({ mismatchPassword: true });
    });

    it('should update validation when password changes', () => {
      const form = new FormGroup(
        {
          password: new FormControl('password123'),
          confirmPassword: new FormControl('password123'),
        },
        { validators: confirmPasswordValidator }
      );

      expect(form.errors).toBeNull();

      form.patchValue({ password: 'newPassword' });
      expect(form.errors).toEqual({ mismatchPassword: true });

      form.patchValue({ confirmPassword: 'newPassword' });
      expect(form.errors).toBeNull();
    });

    it('should be case sensitive', () => {
      const form = new FormGroup(
        {
          password: new FormControl('Password123'),
          confirmPassword: new FormControl('password123'),
        },
        { validators: confirmPasswordValidator }
      );

      expect(form.errors).toEqual({ mismatchPassword: true });
    });
  });
});
