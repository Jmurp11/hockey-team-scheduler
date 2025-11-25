import { initLoginForm, initMagicLinkForm } from './auth.utility';

describe('auth.utility', () => {
  describe('initLoginForm', () => {
    it('should create a form with email and password fields', () => {
      const form = initLoginForm();
      
      expect(form.get('email')).toBeDefined();
      expect(form.get('password')).toBeDefined();
    });

    it('should have email field with required and email validators', () => {
      const form = initLoginForm();
      const emailControl = form.get('email');
      
      expect(emailControl?.hasError('required')).toBe(true);
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBe(false);
      expect(emailControl?.hasError('required')).toBe(false);
    });

    it('should have password field with required validator', () => {
      const form = initLoginForm();
      const passwordControl = form.get('password');
      
      expect(passwordControl?.hasError('required')).toBe(true);
      
      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBe(false);
    });

    it('should initialize with null values', () => {
      const form = initLoginForm();
      
      expect(form.get('email')?.value).toBeNull();
      expect(form.get('password')?.value).toBeNull();
    });

    it('should be invalid when empty', () => {
      const form = initLoginForm();
      expect(form.valid).toBe(false);
    });

    it('should be valid when both fields have valid values', () => {
      const form = initLoginForm();
      form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(form.valid).toBe(true);
    });
  });

  describe('initMagicLinkForm', () => {
    it('should create a form with email field only', () => {
      const form = initMagicLinkForm();
      
      expect(form.get('email')).toBeDefined();
      expect(form.get('password')).toBeNull();
    });

    it('should have email field with required and email validators', () => {
      const form = initMagicLinkForm();
      const emailControl = form.get('email');
      
      expect(emailControl?.hasError('required')).toBe(true);
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBe(false);
      expect(emailControl?.hasError('required')).toBe(false);
    });

    it('should initialize with null value', () => {
      const form = initMagicLinkForm();
      expect(form.get('email')?.value).toBeNull();
    });

    it('should be invalid when empty', () => {
      const form = initMagicLinkForm();
      expect(form.valid).toBe(false);
    });

    it('should be valid when email has valid value', () => {
      const form = initMagicLinkForm();
      form.patchValue({
        email: 'test@example.com',
      });
      
      expect(form.valid).toBe(true);
    });
  });
});
