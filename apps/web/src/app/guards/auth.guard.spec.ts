/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let mockSupabaseService: jest.Mocked<Partial<SupabaseService>>;
  let mockAuthService: any;
  let mockRouter: jest.Mocked<Partial<Router>>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
      },
    };

    mockSupabaseService = {
      getSupabaseClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    // Mock signal-based AuthService
    mockAuthService = {
      setSession: jest.fn(),
      session: {
        set: jest.fn(),
      },
      currentUser: {
        set: jest.fn(),
      },
    };

    mockRouter = {
      createUrlTree: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user has valid session', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = {
      user: mockUser,
      access_token: 'token-123',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(mockAuthService.setSession).toHaveBeenCalledWith(mockSession);
  });

  it('should redirect to auth/login when no user exists', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockRouter.createUrlTree?.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(mockAuthService.session.set).toHaveBeenCalledWith(null);
    expect(mockAuthService.currentUser.set).toHaveBeenCalledWith(null);
  });

  it('should redirect to auth/login when getUser returns error', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Auth error'),
    });
    mockRouter.createUrlTree?.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(mockAuthService.session.set).toHaveBeenCalledWith(null);
    expect(mockAuthService.currentUser.set).toHaveBeenCalledWith(null);
  });

  it('should redirect to login when Supabase client is not available', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseService.getSupabaseClient?.mockReturnValue(undefined as any);
    mockRouter.createUrlTree?.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to auth/login when unexpected error occurs', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getUser.mockRejectedValue(
      new Error('Unexpected error')
    );
    mockRouter.createUrlTree?.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(mockAuthService.session.set).toHaveBeenCalledWith(null);
    expect(mockAuthService.currentUser.set).toHaveBeenCalledWith(null);
  });

  it('should still allow access even if getSession fails after successful getUser', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    // Should still return true because user is authenticated
    expect(result).toBe(true);
    // setSession should not be called with null session
    expect(mockAuthService.setSession).not.toHaveBeenCalled();
  });

  it('should clear auth state when user authentication fails', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Session expired' },
    });
    mockRouter.createUrlTree?.mockReturnValue(urlTree);

    await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    // Verify auth state is cleared
    expect(mockAuthService.session.set).toHaveBeenCalledWith(null);
    expect(mockAuthService.currentUser.set).toHaveBeenCalledWith(null);
  });
});
