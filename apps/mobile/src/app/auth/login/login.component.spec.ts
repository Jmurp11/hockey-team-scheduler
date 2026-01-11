import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService, UserService } from '@hockey-team-scheduler/shared-data-access';
import { NavigationService } from '@hockey-team-scheduler/shared-ui';
import { LoginComponent } from './login.component';
import { ToastService } from '../../shared/toast/toast.service';

/**
 * Tests for LoginComponent
 *
 * This component handles user authentication with email/password.
 * Key behaviors tested:
 * - Form validation (email format, required fields)
 * - Login flow (success, failure, error handling)
 * - Navigation after successful login
 * - Loading state management
 */
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userService: jest.Mocked<UserService>;
  let authService: jest.Mocked<AuthService>;
  let navigationService: jest.Mocked<NavigationService>;
  let toastService: jest.Mocked<ToastService>;

  beforeEach(async () => {
    const userServiceMock = {
      login: jest.fn(),
    };

    const authServiceMock = {
      setSession: jest.fn(),
    };

    const navigationServiceMock = {
      navigateToLink: jest.fn(),
    };

    const toastServiceMock = {
      presentErrorToast: jest.fn(),
      presentSuccessToast: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavigationService, useValue: navigationServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    userService = TestBed.inject(UserService) as jest.Mocked<UserService>;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    navigationService = TestBed.inject(NavigationService) as jest.Mocked<NavigationService>;
    toastService = TestBed.inject(ToastService) as jest.Mocked<ToastService>;

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should have a login form defined', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm instanceof FormGroup).toBe(true);
    });

    it('should have email and password controls', () => {
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
    });

    it('should initialize with empty form values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should initialize with loading state as false', () => {
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should be invalid when form is empty', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('should be invalid with only email filled', () => {
      component.loginForm.patchValue({ email: 'test@example.com' });
      expect(component.loginForm.valid).toBe(false);
    });

    it('should be invalid with only password filled', () => {
      component.loginForm.patchValue({ password: 'password123' });
      expect(component.loginForm.valid).toBe(false);
    });

    it('should be invalid with invalid email format', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(component.loginForm.valid).toBe(false);
      expect(component.loginForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should be valid with valid email and password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('onSubmit - successful login', () => {
    const mockSession = { access_token: 'token123', user: { id: '1' } };

    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should call userService.login with form values', async () => {
      userService.login.mockResolvedValue({ session: mockSession } as any);

      await component.onSubmit();

      expect(userService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should set session on successful login', async () => {
      userService.login.mockResolvedValue({ session: mockSession } as any);

      await component.onSubmit();

      expect(authService.setSession).toHaveBeenCalledWith(mockSession);
    });

    it('should navigate to callback page on successful login', async () => {
      userService.login.mockResolvedValue({ session: mockSession } as any);

      await component.onSubmit();

      expect(navigationService.navigateToLink).toHaveBeenCalledWith('/auth/callback');
    });

    it('should set loading state to true during login', async () => {
      userService.login.mockImplementation(() => {
        expect(component.isLoading()).toBe(true);
        return Promise.resolve({ session: mockSession } as any);
      });

      await component.onSubmit();
    });
  });

  describe('onSubmit - failed login', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    });

    it('should not navigate when login returns no session', async () => {
      userService.login.mockResolvedValue({ session: null } as any);

      await component.onSubmit();

      expect(navigationService.navigateToLink).not.toHaveBeenCalled();
    });

    it('should reset loading state on failed login', async () => {
      userService.login.mockResolvedValue({ session: null } as any);

      await component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('should show error toast on failed login', async () => {
      userService.login.mockResolvedValue({ session: null } as any);

      await component.onSubmit();

      expect(toastService.presentErrorToast).toHaveBeenCalledWith(
        'Login failed. Please try again.'
      );
    });
  });

  describe('onSubmit - error handling', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors gracefully', async () => {
      const errorMessage = 'Invalid credentials';
      userService.login.mockRejectedValue(new Error(errorMessage));

      await component.onSubmit();

      expect(toastService.presentErrorToast).toHaveBeenCalledWith(errorMessage);
    });

    it('should reset loading state on error', async () => {
      userService.login.mockRejectedValue(new Error('Network error'));

      await component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('should not navigate on error', async () => {
      userService.login.mockRejectedValue(new Error('Server error'));

      await component.onSubmit();

      expect(navigationService.navigateToLink).not.toHaveBeenCalled();
    });

    it('should show generic error message for non-Error exceptions', async () => {
      userService.login.mockRejectedValue('Unknown error');

      await component.onSubmit();

      expect(toastService.presentErrorToast).toHaveBeenCalledWith(
        'Login failed. Please check your credentials.'
      );
    });
  });

  describe('onSubmit - loading state guard', () => {
    it('should not call login if already loading', async () => {
      const mockSession = { access_token: 'token123', user: { id: '1' } };
      userService.login.mockResolvedValue({ session: mockSession } as any);

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      // Manually set loading state
      component.isLoading.set(true);

      await component.onSubmit();

      expect(userService.login).not.toHaveBeenCalled();
    });
  });

  describe('navigation service', () => {
    it('should have navigation service accessible', () => {
      expect(component.navigation).toBe(navigationService);
    });

    it('should allow navigation to pricing page', () => {
      component.navigation.navigateToLink('auth/pricing');
      expect(navigationService.navigateToLink).toHaveBeenCalledWith('auth/pricing');
    });

    it('should allow navigation to forgot password page', () => {
      component.navigation.navigateToLink('auth/forgot-password');
      expect(navigationService.navigateToLink).toHaveBeenCalledWith('auth/forgot-password');
    });
  });

  describe('getFormControl helper', () => {
    it('should be defined on the component', () => {
      expect(component.getFormControl).toBeDefined();
      expect(typeof component.getFormControl).toBe('function');
    });
  });
});
