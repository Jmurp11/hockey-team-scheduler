import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const apiKey = environment.rinkLinkAPIKey;
    const cloned = req.clone({
      setHeaders: {
        'x-api-key': apiKey,
      },
    });
    return next.handle(cloned);
  }
}
