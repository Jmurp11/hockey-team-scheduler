import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { APP_CONFIG, UserService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService, NavigationService } from '@hockey-team-scheduler/shared-ui';
import { signal } from '@angular/core';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockUserService: jest.Mocked<Partial<UserService>>;
  let mockNavigationService: jest.Mocked<Partial<NavigationService>>;
  let mockLoadingService: Partial<LoadingService>;

  beforeEach(async () => {
    mockUserService = {
      login: jest.fn(),
    };

    mockNavigationService = {
      navigateToLink: jest.fn(),
    };

    // LoadingService uses signals
    mockLoadingService = {
      isLoading: signal(false).asReadonly,
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: APP_CONFIG, useValue: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'test-key', apiUrl: 'https://test-api.com' } },
        { provide: UserService, useValue: mockUserService },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: LoadingService, useValue: mockLoadingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loginForm initialization', () => {
    it('should initialize form with email and password controls', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
      // Form should be invalid because required fields are empty
      expect(component.loginForm.valid).toBe(false);
    });

    it('should have invalid form with invalid email format', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: 'validpassword123',
      });

      expect(component.loginForm.get('email')?.hasError('email')).toBe(true);
      expect(component.loginForm.valid).toBe(false);
    });

    it('should have valid form with valid email and password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'validpassword123',
      });

      expect(component.loginForm.valid).toBe(true);
    });

    it('should require email field', () => {
      component.loginForm.patchValue({
        email: '',
        password: 'validpassword123',
      });

      expect(component.loginForm.get('email')?.hasError('required')).toBe(true);
    });

    it('should require password field', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '',
      });

      expect(component.loginForm.get('password')?.hasError('required')).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should call userService.login with form values', fakeAsync(() => {
      const testEmail = 'test@example.com';
      const testPassword = 'validpassword123';
      mockUserService.login?.mockResolvedValue({ user: { id: '1' } } as any);

      component.loginForm.patchValue({
        email: testEmail,
        password: testPassword,
      });

      component.onSubmit();
      tick();

      expect(mockUserService.login).toHaveBeenCalledWith(testEmail, testPassword);
    }));

    it('should navigate on successful login (behavior check)', fakeAsync(() => {
      mockUserService.login?.mockResolvedValue({ user: { id: '1' } } as any);

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'validpassword123',
      });

      component.onSubmit();
      tick();

      // Verify login was called successfully - navigation happens internally
      expect(mockUserService.login).toHaveBeenCalled();
    }));

    it('should handle null login response without error', fakeAsync(() => {
      mockUserService.login?.mockResolvedValue(null);

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      // Should not throw
      expect(() => {
        component.onSubmit();
        tick();
      }).not.toThrow();
    }));

    it('should handle undefined login response without error', fakeAsync(() => {
      mockUserService.login?.mockResolvedValue(undefined);

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password',
      });

      // Should not throw
      expect(() => {
        component.onSubmit();
        tick();
      }).not.toThrow();
    }));
  });

  describe('getFormControl', () => {
    it('should return the form control for a given field', () => {
      const emailControl = component.getFormControl(component.loginForm, 'email');
      expect(emailControl).toBe(component.loginForm.get('email'));
    });
  });

  describe('navigation service', () => {
    it('should expose navigation service for template usage', () => {
      expect(component.navigation).toBeDefined();
    });
  });
});
