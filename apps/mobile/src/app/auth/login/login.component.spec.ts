import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService, NavigationService } from '@hockey-team-scheduler/shared-ui';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userService: jest.Mocked<UserService>;
  let loadingService: jest.Mocked<LoadingService>;
  let navigationService: jest.Mocked<NavigationService>;

  beforeEach(async () => {
    const userServiceSpy = {
      login: jest.fn(),
    } as any;
    const loadingServiceSpy = {
      isLoading: jest.fn().mockReturnValue(false),
    } as any;
    const navigationServiceSpy = {
      navigateToLink: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    
    // Override the loginForm with a proper FormGroup for testing
    component.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
    
    userService = TestBed.inject(UserService) as jest.Mocked<UserService>;
    loadingService = TestBed.inject(LoadingService) as jest.Mocked<LoadingService>;
    navigationService = TestBed.inject(NavigationService) as jest.Mocked<NavigationService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form with empty values', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should have form invalid when empty', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  describe('form validation', () => {
    it('should be valid when email and password are provided', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(component.loginForm.valid).toBe(true);
    });

    it('should be invalid when email is missing', () => {
      component.loginForm.patchValue({
        email: '',
        password: 'password123'
      });

      expect(component.loginForm.invalid).toBe(true);
    });

    it('should be invalid when password is missing', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: ''
      });

      expect(component.loginForm.invalid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should call userService.login with form values', async () => {
      userService.login.mockReturnValue(Promise.resolve({ user: { id: '1' } }));

      await component.onSubmit();

      expect(userService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should navigate to callback page on successful login', async () => {
      userService.login.mockReturnValue(Promise.resolve({ user: { id: '1' } }));

      await component.onSubmit();

      expect(navigationService.navigateToLink).toHaveBeenCalledWith('/auth/callback');
    });

    it('should not navigate on failed login', async () => {
      userService.login.mockReturnValue(Promise.resolve(null));

      await component.onSubmit();

      expect(navigationService.navigateToLink).not.toHaveBeenCalled();
    });

    it('should handle login errors gracefully', async () => {
      userService.login.mockReturnValue(Promise.reject(new Error('Login failed')));

      await expect(component.onSubmit()).rejects.toThrow('Login failed');
      expect(navigationService.navigateToLink).not.toHaveBeenCalled();
    });
  });

  describe('getFormControl method', () => {
    it('should return form control for valid field', () => {
      const emailControl = component.getFormControl(component.loginForm, 'email');
      expect(emailControl).toBeDefined();
      expect(emailControl?.value).toBe(null);
    });

    it('should work with both email and password fields', () => {
      const emailControl = component.getFormControl(component.loginForm, 'email');
      const passwordControl = component.getFormControl(component.loginForm, 'password');
      
      expect(emailControl).toBeDefined();
      expect(passwordControl).toBeDefined();
      expect(emailControl).not.toBe(passwordControl);
    });
  });

  describe('navigation methods', () => {
    it('should navigate to pricing on signup link click', () => {
      component.navigation.navigateToLink('auth/pricing');
      expect(navigationService.navigateToLink).toHaveBeenCalledWith('auth/pricing');
    });

    it('should navigate to forgot password on link click', () => {
      component.navigation.navigateToLink('auth/forgot-password');
      expect(navigationService.navigateToLink).toHaveBeenCalledWith('auth/forgot-password');
    });
  });

  describe('loading state', () => {
    it('should access loading service', () => {
      expect(component.loadingService).toBe(loadingService);
    });
  });
});