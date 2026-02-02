import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap, firstValueFrom, catchError, of } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import {
  UserAccess,
  UserAccessResponse,
  UserType,
  UserCapability,
} from '@hockey-team-scheduler/shared-utilities';

/**
 * User Access Service
 *
 * Provides unified user access management for the Angular applications.
 * This service determines if a user has access to:
 * - App routes (/app/*) - requires app_users record
 * - Developer routes (/developer/*) - requires active api_users record
 *
 * KEY FEATURES:
 * - Single source of truth for user access state
 * - Reactive signals for UI binding
 * - Integration with Supabase Auth session
 * - API fallback for access checking
 *
 * USAGE:
 * - Call `loadUserAccess()` after successful login
 * - Use signals like `isAppUser()`, `isApiUser()` in templates/guards
 * - Subscribe to `userAccess$` for reactive updates
 */
@Injectable({ providedIn: 'root' })
export class UserAccessService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  // ============ STATE ============

  /**
   * Current user access information.
   * Null until loadUserAccess() is called after login.
   */
  userAccess = signal<UserAccess | null>(null);

  /**
   * Loading state for access check
   */
  isLoading = signal<boolean>(false);

  /**
   * Error state
   */
  error = signal<string | null>(null);

  // ============ COMPUTED SIGNALS ============

  /**
   * Whether the current user has app access (exists in app_users)
   */
  isAppUser = computed(() => this.userAccess()?.isAppUser ?? false);

  /**
   * Whether the current user has API/developer access (active api_users record)
   */
  isApiUser = computed(() => this.userAccess()?.isApiUser ?? false);

  /**
   * The user type classification
   */
  userType = computed<UserType>(() => this.userAccess()?.userType ?? 'none');

  /**
   * Whether the user has both app and developer access
   */
  hasBothAccess = computed(() => this.userType() === 'both');

  /**
   * Whether the user should see the Developer menu item in sidenav
   */
  showDeveloperMenu = computed(() => this.isApiUser());

  /**
   * The default redirect path after login based on user type
   */
  defaultRedirect = computed(() => this.userAccess()?.defaultRedirect ?? '/login');

  /**
   * Whether the user's app profile is complete
   */
  isAppProfileComplete = computed(() => this.userAccess()?.isAppProfileComplete ?? false);

  /**
   * User capabilities derived from access state.
   * This is the primary way to check what a user can access.
   */
  capabilities = computed<UserCapability[]>(() => {
    const access = this.userAccess();
    if (!access) return [];

    const caps: UserCapability[] = [];
    if (access.isAppUser) caps.push(UserCapability.APP_ACCESS);
    if (access.isApiUser) caps.push(UserCapability.DEVELOPER_ACCESS);
    return caps;
  });

  /**
   * Checks if the user has a specific capability.
   * @param capability The capability to check
   * @returns true if user has the capability
   */
  hasCapability(capability: UserCapability): boolean {
    return this.capabilities().includes(capability);
  }

  // ============ METHODS ============

  /**
   * Loads user access information from the API.
   * Should be called after successful Supabase Auth login.
   *
   * This method:
   * 1. Gets the current session token
   * 2. Calls the API to get user access info
   * 3. Updates the userAccess signal
   *
   * @returns Promise resolving to UserAccess or null if not authenticated
   */
  async loadUserAccess(): Promise<UserAccess | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const client = this.supabaseService.getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client not available');
      }

      // Get current session
      const { data: { session }, error: sessionError } = await client.auth.getSession();

      if (sessionError || !session) {
        console.warn('[UserAccess] No active session');
        this.userAccess.set(null);
        return null;
      }

      // Call API with auth token
      const response = await firstValueFrom(
        this.http.get<UserAccessResponse>(
          `${this.config.apiUrl}/users/me/access`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        ).pipe(
          catchError((err) => {
            console.error('[UserAccess] API error:', err);
            // Fallback to local check
            return of(null);
          })
        )
      );

      if (response?.success) {
        this.userAccess.set(response.access);
        return response.access;
      }

      // API call failed, try local fallback
      return await this.loadUserAccessLocal(session.user.id, session.user.email || '');
    } catch (err: any) {
      console.error('[UserAccess] Error loading access:', err);
      this.error.set(err.message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Local fallback for determining user access.
   * Used when API is unavailable.
   */
  private async loadUserAccessLocal(authUserId: string, email: string): Promise<UserAccess | null> {
    const client = this.supabaseService.getSupabaseClient();
    if (!client) {
      return null;
    }

    try {
      // Check app_users
      const { data: appUser } = await client
        .from('app_users')
        .select('id, name, association, team')
        .eq('user_id', authUserId)
        .single();

      // Check api_users
      const { data: apiUser } = await client
        .from('api_users')
        .select('id, is_active, auth_user_id')
        .or(`auth_user_id.eq.${authUserId},and(email.eq.${email},auth_user_id.is.null)`)
        .eq('is_active', true)
        .single();

      const isAppUser = !!appUser;
      const isApiUser = !!apiUser && apiUser.is_active;

      let userType: UserType;
      let defaultRedirect: string;

      if (isAppUser && isApiUser) {
        userType = 'both';
        defaultRedirect = '/app';
      } else if (isAppUser) {
        userType = 'app_only';
        defaultRedirect = '/app';
      } else if (isApiUser) {
        userType = 'api_only';
        defaultRedirect = '/developer/dashboard';
      } else {
        userType = 'none';
        defaultRedirect = '/login';
      }

      const isAppProfileComplete = appUser
        ? !!(appUser.name && appUser.association && appUser.team)
        : undefined;

      // Build capabilities array
      const capabilities: UserCapability[] = [];
      if (isAppUser) capabilities.push(UserCapability.APP_ACCESS);
      if (isApiUser) capabilities.push(UserCapability.DEVELOPER_ACCESS);

      const access: UserAccess = {
        authUserId,
        email,
        isAppUser,
        isApiUser,
        userType,
        capabilities,
        defaultRedirect,
        appUserId: appUser?.id,
        apiUserId: apiUser?.id,
        isAppProfileComplete,
      };

      this.userAccess.set(access);
      return access;
    } catch (err) {
      console.error('[UserAccess] Local fallback error:', err);
      return null;
    }
  }

  /**
   * Determines the appropriate redirect path based on user access and profile state.
   *
   * Logic:
   * - App user without complete profile -> /app/complete-profile
   * - App user with profile (or both) -> /app/schedule
   * - API user only -> /developer/dashboard
   * - No access -> /login
   */
  getRedirectPath(): string {
    const access = this.userAccess();

    if (!access) {
      return '/login';
    }

    switch (access.userType) {
      case 'both':
      case 'app_only':
        // Check if profile is complete
        if (access.isAppProfileComplete === false) {
          return '/app/complete-profile';
        }
        return '/app/schedule';

      case 'api_only':
        return '/developer/dashboard';

      default:
        return '/login';
    }
  }

  /**
   * Checks if user has access to app routes.
   * Used by app route guards.
   */
  async canAccessApp(): Promise<boolean> {
    // Ensure access is loaded
    if (!this.userAccess()) {
      await this.loadUserAccess();
    }

    return this.isAppUser();
  }

  /**
   * Checks if user has access to developer routes.
   * Used by developer route guards.
   */
  async canAccessDeveloper(): Promise<boolean> {
    // Ensure access is loaded
    if (!this.userAccess()) {
      await this.loadUserAccess();
    }

    return this.isApiUser();
  }

  /**
   * Clears user access state.
   * Should be called on logout.
   */
  clearAccess(): void {
    this.userAccess.set(null);
    this.error.set(null);
  }

  /**
   * Gets the API user ID for the current user.
   * Useful for developer portal operations.
   */
  getApiUserId(): number | undefined {
    return this.userAccess()?.apiUserId;
  }

  /**
   * Refreshes user access from the API.
   * Useful after user completes profile or subscribes to API.
   */
  async refreshAccess(): Promise<UserAccess | null> {
    return this.loadUserAccess();
  }
}
