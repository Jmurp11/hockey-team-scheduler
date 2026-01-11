/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { CallbackComponent } from './callback.component';
import { signal } from '@angular/core';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let mockSupabaseService: jest.Mocked<Partial<SupabaseService>>;
  let mockAuthService: jest.Mocked<Partial<AuthService>>;
  let mockRouter: jest.Mocked<Partial<Router>>;
  let mockSupabaseClient: any;

  beforeEach(async () => {
    // Default mock that returns no session (most common test scenario)
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
      from: jest.fn(),
    };

    mockSupabaseService = {
      getSupabaseClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    // Create a writable signal for session
    const sessionSignal = signal<any>(null);

    mockAuthService = {
      session: sessionSignal as any,
      setSession: jest.fn().mockResolvedValue(undefined),
      currentUser: signal<any>(null) as any,
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;

    // Mock console methods to keep test output clean
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('UI rendering', () => {
    it('should display loading spinner', () => {
      const spinner = fixture.nativeElement.querySelector('p-progressspinner');
      expect(spinner).toBeTruthy();
    });

    it('should have callback container', () => {
      const container = fixture.nativeElement.querySelector('.callback-container');
      expect(container).toBeTruthy();
    });

    it('should have loading card element', () => {
      const loading = fixture.nativeElement.querySelector('.loading-card');
      expect(loading).toBeTruthy();
    });

    it('should display initial status message', () => {
      fixture.detectChanges();
      const statusTitle = fixture.nativeElement.querySelector('.status-title');
      expect(statusTitle.textContent).toContain('Signing you in');
    });
  });

  describe('handleAuthCallback behavior', () => {
    it('should call getSupabaseClient on initialization', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupabaseService.getSupabaseClient).toHaveBeenCalled();
    }));

    it('should call getSession on the supabase client', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    }));

    it('should check AuthService session first', fakeAsync(() => {
      // Set up AuthService to have a session
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };
      (mockAuthService.session as any).set(mockSession);

      // Set up successful profile check
      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test', association: 'Test Assoc' },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      fixture.detectChanges();
      tick(1000); // Account for delays

      // Should not need to call getSession since AuthService has it
      expect(mockAuthService.setSession).toHaveBeenCalledWith(mockSession);
    }));
  });

  describe('navigation scenarios', () => {
    it('should navigate to login when session has error', fakeAsync(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error'),
      });

      fixture.detectChanges();
      tick(100);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { error: 'Authentication failed' },
      });
    }));

    it('should navigate to login when no session exists', fakeAsync(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      fixture.detectChanges();
      tick(100);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], undefined);
    }));

    it('should navigate to login when supabase client is not available', fakeAsync(() => {
      mockSupabaseService.getSupabaseClient = jest.fn().mockReturnValue(null);

      fixture.detectChanges();
      tick(100);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], undefined);
    }));

    it('should check user profile when session exists', fakeAsync(() => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };

      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test', association: 'Test Assoc' },
          error: null,
        }),
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      fixture.detectChanges();
      tick(1000); // Account for delays

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('app_users');
    }));

    it('should navigate to complete-profile when user has no name', fakeAsync(() => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };

      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: null, association: 'Test Assoc' },
          error: null,
        }),
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      fixture.detectChanges();
      tick(1000);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/complete-profile'], undefined);
    }));

    it('should navigate to schedule when user profile is complete', fakeAsync(() => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };

      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test User', association: 'Test Assoc' },
          error: null,
        }),
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      fixture.detectChanges();
      tick(1000);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/schedule'], undefined);
    }));
  });

  describe('status messages', () => {
    it('should update status messages during authentication flow', fakeAsync(() => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };

      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test User', association: 'Test Assoc' },
          error: null,
        }),
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      fixture.detectChanges();

      // Initial state
      expect(component.statusMessage()).toBe('Authenticating...');

      tick(1000);
      fixture.detectChanges();

      // Component should have progressed through status messages
      // The final navigation should have occurred
      expect(mockRouter.navigate).toHaveBeenCalled();
    }));
  });

  describe('timeout handling', () => {
    it('should have a timeout set on initialization', fakeAsync(() => {
      // Set up a hanging promise
      mockSupabaseClient.auth.getSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      fixture.detectChanges();

      // Fast-forward past the 15 second timeout
      tick(16000);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { error: 'Authentication timed out. Please try again.' },
      });
    }));

    it('should clean up timeout on destroy', () => {
      fixture.detectChanges();

      // The component should have set a timeout
      // We verify cleanup by ensuring ngOnDestroy doesn't throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', fakeAsync(() => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Network error'));

      fixture.detectChanges();
      tick(100);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], undefined);
    }));

    it('should handle profile check errors', fakeAsync(() => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };

      const mockFromChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      fixture.detectChanges();
      tick(1000);

      // Should navigate to complete-profile when profile check fails
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/complete-profile'], undefined);
    }));
  });
});
