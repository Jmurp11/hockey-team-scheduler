import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { PrimeNG } from 'primeng/config';
import { App } from './app.component';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrimeNG: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authStateCallback: any;

  beforeEach(async () => {
    const mockSupabaseClient = {
      auth: {
        onAuthStateChange: jasmine
          .createSpy('onAuthStateChange')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .and.callFake((callback: any) => {
            authStateCallback = callback;
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return { data: { subscription: { unsubscribe: () => {} } } };
          }),
      },
    };

    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getSupabaseClient',
    ]);
    mockSupabaseService.getSupabaseClient.and.returnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any,
    );

    mockAuthService = jasmine.createSpyObj('AuthService', ['setSession']);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockPrimeNG = {
      ripple: {
        set: jasmine.createSpy('set'),
      },
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: PrimeNG, useValue: mockPrimeNG },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have title "app"', () => {
    expect(component['title']).toBe('app');
  });

  describe('ngOnInit', () => {
    it('should enable PrimeNG ripple effect', () => {
      fixture.detectChanges();
      expect(mockPrimeNG.ripple.set).toHaveBeenCalledWith(true);
    });

    it('should setup auth state listener', () => {
      fixture.detectChanges();
      expect(mockSupabaseService.getSupabaseClient).toHaveBeenCalled();
    });
  });

  describe('auth state listener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set session when user signs in', () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };

      authStateCallback('SIGNED_IN', mockSession);

      // @ts-expect-error - Partial mock Session object for testing
      expect(mockAuthService.setSession).toHaveBeenCalledWith(mockSession);
    });

    it('should clear session when user signs out', () => {
      authStateCallback('SIGNED_OUT', null);

      expect(mockAuthService.setSession).toHaveBeenCalledWith(null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/landing']);
    });

    it('should set session to null when session is undefined', () => {
      authStateCallback('TOKEN_REFRESHED', null);

      expect(mockAuthService.setSession).toHaveBeenCalledWith(null);
    });

    it('should update session on token refresh', () => {
      const mockSession = {
        access_token: 'new-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };

      authStateCallback('TOKEN_REFRESHED', mockSession);

      // @ts-expect-error - Partial mock Session object for testing
      expect(mockAuthService.setSession).toHaveBeenCalledWith(mockSession);
    });

    it('should not navigate to landing on non-signout events', () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };

      authStateCallback('SIGNED_IN', mockSession);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});
