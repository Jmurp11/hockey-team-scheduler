import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApiKeyInterceptor } from './shared/api-key.interceptor';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_CONFIG } from '@hockey-team-scheduler/shared-data-access';
import Lara from '@primeng/themes/lara';
import { FilterMatchMode, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { routes } from './app.routes';
import { environment } from './environments/environment';

const apiKeyInterceptor = new ApiKeyInterceptor();
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        (req, next) => apiKeyInterceptor.intercept(req, { handle: next })
      ])
    ),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      ripple: true,
      filterMatchModeOptions: {
        text: [
          FilterMatchMode.STARTS_WITH,
          FilterMatchMode.CONTAINS,
          FilterMatchMode.NOT_CONTAINS,
          FilterMatchMode.ENDS_WITH,
          FilterMatchMode.EQUALS,
          FilterMatchMode.NOT_EQUALS,
        ],
        numeric: [
          FilterMatchMode.EQUALS,
          FilterMatchMode.NOT_EQUALS,
          FilterMatchMode.LESS_THAN,
          FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
          FilterMatchMode.GREATER_THAN,
          FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
        ],
        date: [
          FilterMatchMode.DATE_IS,
          FilterMatchMode.DATE_IS_NOT,
          FilterMatchMode.DATE_BEFORE,
          FilterMatchMode.DATE_AFTER,
        ],
      },
    }),
    MessageService,
    DialogService,
    {
      provide: APP_CONFIG,
      useValue: {
        apiUrl: environment.apiUrl,
        supabaseUrl: environment.PUBLIC_SUPABASE_URL,
        supabaseAnonKey: environment.PUBLIC_SUPABASE_SERVICE_ROLE,
        appName: 'web', // Differentiates from mobile app storage
      },
    },
  ],
};
