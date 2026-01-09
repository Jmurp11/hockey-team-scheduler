/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let mockSupabaseService: jest.Mocked<Partial<SupabaseService>>;
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

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
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

    it('should have loading element', () => {
      const loading = fixture.nativeElement.querySelector('.loading');
      expect(loading).toBeTruthy();
    });
  });

  describe('handleAuthCallback behavior', () => {
    // Note: These tests verify the component's internal method behavior
    // The actual navigation happens asynchronously, so we test the method exists
    // and the component structure is correct

    it('should call getSupabaseClient on initialization', async () => {
      fixture.detectChanges();

      // Wait for async operations
      await fixture.whenStable();

      expect(mockSupabaseService.getSupabaseClient).toHaveBeenCalled();
    });

    it('should call getSession on the supabase client', async () => {
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('navigation scenarios', () => {
    it('should navigate to login when session has error', async () => {
      // Suppress console.error for this test
      jest.spyOn(console, 'error').mockImplementation();

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error'),
      });

      fixture.detectChanges();
      await fixture.whenStable();

      // Allow time for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { error: 'Authentication failed' },
      });
    });

    it('should navigate to login when no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      fixture.detectChanges();
      await fixture.whenStable();

      // Allow time for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should check user profile when session exists', async () => {
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
      await fixture.whenStable();

      // Allow time for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('app_users');
    });
  });
});
