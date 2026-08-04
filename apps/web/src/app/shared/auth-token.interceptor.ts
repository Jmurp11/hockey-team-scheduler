import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';

/**
 * Attaches the current user's Supabase JWT as `Authorization: Bearer <token>`
 * so the API can authenticate the first-party user. Requests made while signed
 * out carry no token (public endpoints only). The frontend no longer sends a
 * static API key — that mechanism is reserved for external metered API customers.
 *
 * Implemented as a functional interceptor so it runs inside Angular's injection
 * context (a class instance created with `new` cannot call `inject()`).
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const supabase = inject(SupabaseService);

  return from(supabase.getAccessToken()).pipe(
    switchMap((token) =>
      next(
        token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req
      )
    )
  );
};
