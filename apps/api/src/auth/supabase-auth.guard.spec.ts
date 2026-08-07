import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';

jest.mock('../supabase', () => ({
  supabase: { auth: { getUser: jest.fn() } },
}));

import { supabase } from '../supabase';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: Reflector;
  const getUser = supabase.auth.getUser as jest.Mock;

  const makeContext = (
    headers: Record<string, string> = {},
    request: any = {},
  ): ExecutionContext => {
    const req = { headers, ...request };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SupabaseAuthGuard(reflector);
    jest.clearAllMocks();
  });

  it('allows @Public routes without a token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rejects a missing Bearer token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(makeContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid/expired token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    getUser.mockResolvedValue({ data: null, error: { message: 'bad jwt' } });
    await expect(
      guard.canActivate(makeContext({ authorization: 'Bearer junk' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the resolved identity for a valid token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    getUser.mockResolvedValue({
      data: { user: { id: 'auth-123', email: 'a@b.com' } },
      error: null,
    });
    const req: any = { headers: { authorization: 'Bearer good' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.authUserId).toBe('auth-123');
    expect(req.authUser).toEqual({ id: 'auth-123', email: 'a@b.com' });
  });
});
