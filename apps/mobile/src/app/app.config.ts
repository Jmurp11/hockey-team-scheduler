import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApiKeyInterceptor } from './shared/api-key.interceptor';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  APP_CONFIG,
  AssociationsService,
  AuthService,
  MessagesService,
  SupabaseService,
  TeamsService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  LoadingService,
  NavigationService,
} from '@hockey-team-scheduler/shared-ui';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

const apiKeyInterceptor = new ApiKeyInterceptor();

/**
 * Initialize auth session on app startup
 * This ensures the session is restored from storage before any route guards run
 */
function initializeAuth(
  supabaseService: SupabaseService,
  authService: AuthService,
) {
  return async () => {
    try {
      const client = supabaseService.getSupabaseClient();
      if (client) {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (session) {
          await authService.setSession(session);
        }

        // Listen for auth state changes
        client.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            await authService.setSession(session);
          } else {
            await authService.setSession(null);
          }
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([
        (req, next) => apiKeyInterceptor.intercept(req, { handle: next }),
      ]),
    ),
    provideIonicAngular({}),
    LoadingService,
    NavigationService,
    UserService,
    AssociationsService,
    TeamsService,
    MessagesService,
    {
      provide: APP_CONFIG,
      useValue: {
        apiUrl: environment.apiUrl,
        supabaseUrl: environment.PUBLIC_SUPABASE_URL,
        supabaseAnonKey: environment.PUBLIC_SUPABASE_SERVICE_ROLE,
        appName: 'mobile', // Differentiates from web app storage
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [SupabaseService, AuthService],
      multi: true,
    },
  ],
};
