import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiKeyInterceptor } from './api-key.interceptor';
import { environment } from '../../environments/environment';

/**
 * Tests for ApiKeyInterceptor
 *
 * This interceptor adds the API key header to all outgoing HTTP requests.
 * This is critical for authenticating requests to the RinkLink API.
 *
 * Key behaviors tested:
 * - Adds x-api-key header to all requests
 * - Preserves existing headers
 * - Preserves request body and method
 * - Passes modified request to the handler
 */
describe('ApiKeyInterceptor', () => {
  let interceptor: ApiKeyInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiKeyInterceptor],
    });
    interceptor = TestBed.inject(ApiKeyInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('intercept', () => {
    it('should add x-api-key header to the request', (done) => {
      const mockRequest = new HttpRequest('GET', '/api/test');
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          // Verify the header was added
          expect(req.headers.has('x-api-key')).toBe(true);
          expect(req.headers.get('x-api-key')).toBe(environment.rinkLinkAPIKey);
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });

    it('should preserve existing headers', (done) => {
      // Create request with custom headers
      const requestWithAuth = new HttpRequest('GET', '/api/test').clone({
        setHeaders: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
      });

      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          // Verify original headers are preserved
          expect(req.headers.get('Authorization')).toBe('Bearer token123');
          expect(req.headers.get('Content-Type')).toBe('application/json');
          // And new header is added
          expect(req.headers.get('x-api-key')).toBe(environment.rinkLinkAPIKey);
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(requestWithAuth, mockHandler).subscribe();
    });

    it('should preserve request method', (done) => {
      const mockRequest = new HttpRequest('POST', '/api/test');
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          expect(req.method).toBe('POST');
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });

    it('should preserve request URL', (done) => {
      const testUrl = '/api/tournaments/123';
      const mockRequest = new HttpRequest('GET', testUrl);
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          expect(req.url).toBe(testUrl);
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });

    it('should preserve request body', (done) => {
      const testBody = { name: 'Test Tournament', date: '2024-01-01' };
      const mockRequest = new HttpRequest('POST', '/api/tournaments', testBody);
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          expect(req.body).toEqual(testBody);
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });

    it('should work with PUT requests', (done) => {
      const testBody = { id: 1, name: 'Updated Tournament' };
      const mockRequest = new HttpRequest('PUT', '/api/tournaments/1', testBody);
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          expect(req.method).toBe('PUT');
          expect(req.body).toEqual(testBody);
          expect(req.headers.get('x-api-key')).toBe(environment.rinkLinkAPIKey);
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });

    it('should work with DELETE requests', (done) => {
      const mockRequest = new HttpRequest('DELETE', '/api/tournaments/1');
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          expect(req.method).toBe('DELETE');
          expect(req.headers.get('x-api-key')).toBe(environment.rinkLinkAPIKey);
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });

    it('should return the observable from the handler', (done) => {
      const mockResponse = new HttpResponse({ status: 200, body: { success: true } });
      const mockRequest = new HttpRequest('GET', '/api/test');
      const mockHandler: HttpHandler = {
        handle: (): Observable<HttpEvent<any>> => of(mockResponse),
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe((response) => {
        expect(response).toBe(mockResponse);
        done();
      });
    });

    it('should not modify the original request object', () => {
      const originalRequest = new HttpRequest('GET', '/api/test');
      const originalHeaderCount = originalRequest.headers.keys().length;

      const mockHandler: HttpHandler = {
        handle: (): Observable<HttpEvent<any>> => of(new HttpResponse({ status: 200 })),
      };

      interceptor.intercept(originalRequest, mockHandler).subscribe();

      // Original request should not be modified
      expect(originalRequest.headers.keys().length).toBe(originalHeaderCount);
      expect(originalRequest.headers.has('x-api-key')).toBe(false);
    });
  });

  describe('API key value', () => {
    it('should use the API key from environment', (done) => {
      const mockRequest = new HttpRequest('GET', '/api/test');
      const mockHandler: HttpHandler = {
        handle: (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
          const apiKey = req.headers.get('x-api-key');
          // Verify it matches the environment value
          expect(apiKey).toBe(environment.rinkLinkAPIKey);
          // Verify it's a non-empty string
          expect(apiKey).toBeTruthy();
          expect(typeof apiKey).toBe('string');
          done();
          return of(new HttpResponse({ status: 200 }));
        },
      };

      interceptor.intercept(mockRequest, mockHandler).subscribe();
    });
  });
});
