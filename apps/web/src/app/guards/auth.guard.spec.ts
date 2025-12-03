/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let mockSupabaseService: jest.Mocked<SupabaseService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
      },
    };

    mockSupabaseService = {
      getSupabaseClient: jest.fn().mockReturnValue(mockSupabaseClient),
    };

    mockAuthService = {
      setSession: jest.fn(),
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
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123',
    };

    mockSupabaseClient.auth.getSession.mockReturnValue(
      Promise.resolve({ data: { session: mockSession }, error: null })
    );

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    // @ts-expect-error - Partial mock Session object for testing
    expect(mockAuthService.setSession).toHaveBeenCalledWith(mockSession);
  });

  it('should redirect to login when no session exists', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getSession.mockReturnValue(
      Promise.resolve({ data: { session: null }, error: null })
    );
    mockRouter.createUrlTree.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(mockAuthService.setSession).not.toHaveBeenCalled();
  });

  it('should redirect to login when auth error occurs', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getSession.mockReturnValue(
      Promise.resolve({ data: { session: null }, error: new Error('Auth error') })
    );
    mockRouter.createUrlTree.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when Supabase client is not available', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseService.getSupabaseClient.mockReturnValue(undefined);
    mockRouter.createUrlTree.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when unexpected error occurs', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Unexpected error'));
    mockRouter.createUrlTree.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should not set session when no user in session', async () => {
    const urlTree = {} as UrlTree;
    const mockSession = {
      user: null,
      access_token: 'token-123',
    };

    mockSupabaseClient.auth.getSession.mockReturnValue(
      Promise.resolve({ data: { session: mockSession }, error: null })
    );
    mockRouter.createUrlTree.mockReturnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockAuthService.setSession).not.toHaveBeenCalled();
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
