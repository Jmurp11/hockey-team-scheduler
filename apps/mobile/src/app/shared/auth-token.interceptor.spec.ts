import { TestBed } from '@angular/core/testing';
import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { authTokenInterceptor } from './auth-token.interceptor';

/**
 * The frontend authenticates to the API with the user's Supabase JWT only.
 * It no longer attaches a static x-api-key (that path is reserved for external
 * metered API customers).
 */
describe('authTokenInterceptor', () => {
  let getAccessToken: jest.Mock;

  beforeEach(() => {
    getAccessToken = jest.fn().mockResolvedValue(null);
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { getAccessToken } }],
    });
  });

  const run = (req: HttpRequest<unknown>, next: HttpHandlerFn) =>
    TestBed.runInInjectionContext(() => authTokenInterceptor(req, next));

  it('attaches the Supabase Bearer token when a session exists', (done) => {
    getAccessToken.mockResolvedValue('jwt-abc');
    const req = new HttpRequest('GET', '/api/test');
    const next: HttpHandlerFn = (r): Observable<HttpEvent<unknown>> => {
      expect(r.headers.get('Authorization')).toBe('Bearer jwt-abc');
      done();
      return of(new HttpResponse({ status: 200 }));
    };
    run(req, next).subscribe();
  });

  it('does not attach Authorization or x-api-key when signed out', (done) => {
    const req = new HttpRequest('GET', '/api/test');
    const next: HttpHandlerFn = (r): Observable<HttpEvent<unknown>> => {
      expect(r.headers.has('Authorization')).toBe(false);
      expect(r.headers.has('x-api-key')).toBe(false);
      done();
      return of(new HttpResponse({ status: 200 }));
    };
    run(req, next).subscribe();
  });
});
