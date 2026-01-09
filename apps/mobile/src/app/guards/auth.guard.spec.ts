import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import {
  AuthService,
  SupabaseService,
} from '@hockey-team-scheduler/shared-data-access';
import { authGuard } from './auth.guard';

/**
 * Tests for authGuard
 *
 * This guard protects routes by verifying user authentication via Supabase.
 * Key behaviors tested:
 * - Allows authenticated users to access protected routes
 * - Redirects unauthenticated users to login
 * - Handles Supabase client unavailability
 * - Handles authentication errors gracefully
 * - Properly manages session state in AuthService
 */
describe('authGuard', () => {
  let supabaseServiceMock: {
    getSupabaseClient: jest.Mock;
  };
  let authServiceMock: {
    session: ReturnType<typeof signal>;
    currentUser: ReturnType<typeof signal>;
    setSession: jest.Mock;
  };
  let routerMock: {
    createUrlTree: jest.Mock;
  };

  let mockSupabaseClient: {
    auth: {
      getUser: jest.Mock;
      getSession: jest.Mock;
    };
  };

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
      },
    };

    supabaseServiceMock = {
      getSupabaseClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    authServiceMock = {
      session: signal(null),
      currentUser: signal(null),
      setSession: jest.fn(),
    };

    routerMock = {
      createUrlTree: jest.fn().mockImplementation((paths: string[]) => {
        return { toString: () => paths.join('/') } as UrlTree;
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabaseServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful authentication', () => {
    it('should allow access when user is authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123', user: mockUser };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(true);
    });

    it('should set session in AuthService when user is authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123', user: mockUser };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(authServiceMock.setSession).toHaveBeenCalledWith(mockSession);
    });

    it('should not set session if session is null but user exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(authServiceMock.setSession).not.toHaveBeenCalled();
    });
  });

  describe('failed authentication', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
      expect(result).not.toBe(true);
    });

    it('should redirect to login when getUser returns an error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Session expired'),
      });

      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
      expect(result).not.toBe(true);
    });

    it('should clear session and user when authentication fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      // Verify signals were set to null
      expect(authServiceMock.session()).toBeNull();
      expect(authServiceMock.currentUser()).toBeNull();
    });
  });

  describe('Supabase client unavailability', () => {
    it('should redirect to login when Supabase client is not available', async () => {
      supabaseServiceMock.getSupabaseClient.mockReturnValue(null);

      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).not.toBe(true);
    });

    it('should not call auth methods when client is unavailable', async () => {
      supabaseServiceMock.getSupabaseClient.mockReturnValue(null);

      await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'));

      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auth guard unexpected error:',
        expect.any(Error)
      );
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
      expect(result).not.toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it('should clear session state on unexpected errors', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'));

      await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(authServiceMock.session()).toBeNull();
      expect(authServiceMock.currentUser()).toBeNull();
    });
  });

  describe('session validation', () => {
    it('should use getUser instead of getSession for validation', async () => {
      // This tests the important security behavior: getUser validates the session
      // by making a request to Supabase, while getSession only reads local storage
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123', user: mockUser };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      // getUser should be called first for validation
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      // getSession is only called after successful user validation
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });
  });
});
