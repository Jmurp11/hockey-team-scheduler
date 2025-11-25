/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getSession: jasmine.createSpy('getSession'),
      },
    };

    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getSupabaseClient',
    ]);
    mockSupabaseService.getSupabaseClient.and.returnValue(mockSupabaseClient);

    mockAuthService = jasmine.createSpyObj('AuthService', ['setSession']);

    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

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

    mockSupabaseClient.auth.getSession.and.returnValue(
      Promise.resolve({ data: { session: mockSession }, error: null })
    );

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
    // @ts-expect-error - Partial mock Session object for testing
    expect(mockAuthService.setSession).toHaveBeenCalledWith(mockSession);
  });

  it('should redirect to login when no session exists', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getSession.and.returnValue(
      Promise.resolve({ data: { session: null }, error: null })
    );
    mockRouter.createUrlTree.and.returnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(mockAuthService.setSession).not.toHaveBeenCalled();
  });

  it('should redirect to login when auth error occurs', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getSession.and.returnValue(
      Promise.resolve({ data: { session: null }, error: new Error('Auth error') })
    );
    mockRouter.createUrlTree.and.returnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when Supabase client is not available', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseService.getSupabaseClient.and.returnValue(undefined);
    mockRouter.createUrlTree.and.returnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when unexpected error occurs', async () => {
    const urlTree = {} as UrlTree;
    mockSupabaseClient.auth.getSession.and.throwError('Unexpected error');
    mockRouter.createUrlTree.and.returnValue(urlTree);

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

    mockSupabaseClient.auth.getSession.and.returnValue(
      Promise.resolve({ data: { session: mockSession }, error: null })
    );
    mockRouter.createUrlTree.and.returnValue(urlTree);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(urlTree);
    expect(mockAuthService.setSession).not.toHaveBeenCalled();
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
