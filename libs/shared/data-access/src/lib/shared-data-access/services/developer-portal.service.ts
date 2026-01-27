import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, BehaviorSubject, from, switchMap } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { SupabaseService } from './supabase.service';
import {
  CreateDeveloperCheckoutDto,
  DeveloperCheckoutResponse,
  DeveloperCheckoutStatus,
  DeveloperDashboard,
  ApiKeyRotationResponse,
  SubscriptionCancelResponse,
  ApiSubscriptionStatus,
} from '@hockey-team-scheduler/shared-utilities';

/**
 * Developer Portal Service
 *
 * Handles all client-side operations for the Developer Portal including:
 * - Stripe checkout for API subscription
 * - Session management using Supabase Auth
 * - Dashboard data fetching
 * - API key rotation
 * - Subscription management
 *
 * SESSION MANAGEMENT:
 * Uses Supabase Auth exclusively for authentication.
 * Users log in via the unified login flow and access developer features
 * if they have an active api_users record.
 */
@Injectable({ providedIn: 'root' })
export class DeveloperPortalService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private supabaseService = inject(SupabaseService);

  // Authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Dashboard data signal for reactive updates
  dashboard = signal<DeveloperDashboard | null>(null);

  constructor() {
    // Check authentication on service initialization
    this.checkAuthenticationState();
    // Clean up any legacy tokens from previous auth system
    this.cleanupLegacyTokens();
  }

  /**
   * Checks authentication state using Supabase session.
   */
  private async checkAuthenticationState(): Promise<void> {
    const client = this.supabaseService.getSupabaseClient();
    if (client) {
      const {
        data: { session },
      } = await client.auth.getSession();
      this.isAuthenticatedSubject.next(!!session);
    }
  }

  /**
   * Cleans up legacy JWT tokens from localStorage.
   * These were used by the deprecated magic link authentication.
   */
  private cleanupLegacyTokens(): void {
    localStorage.removeItem('developer_token');
    localStorage.removeItem('developer_token_expiry');
  }

  // ============ CHECKOUT ============

  /**
   * Creates a Stripe Checkout session for developer API access.
   */
  createCheckout(dto: CreateDeveloperCheckoutDto): Observable<DeveloperCheckoutResponse> {
    return this.http.post<DeveloperCheckoutResponse>(
      `${this.config.apiUrl}/developers/checkout`,
      dto
    );
  }

  /**
   * Gets the status of a checkout session.
   */
  getCheckoutStatus(sessionId: string): Observable<DeveloperCheckoutStatus> {
    return this.http.get<DeveloperCheckoutStatus>(
      `${this.config.apiUrl}/developers/checkout/${sessionId}`
    );
  }

  // ============ AUTHENTICATION ============

  /**
   * Checks if user is authenticated via Supabase session.
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.getValue();
  }

  /**
   * Async check for authentication status.
   * Validates with Supabase and updates the subject.
   */
  async checkAuthenticated(): Promise<boolean> {
    const client = this.supabaseService.getSupabaseClient();
    if (!client) return false;

    const {
      data: { session },
    } = await client.auth.getSession();
    const isAuth = !!session;
    this.isAuthenticatedSubject.next(isAuth);
    return isAuth;
  }

  /**
   * Gets the Supabase authentication token for API requests.
   */
  async getAuthToken(): Promise<string | null> {
    const client = this.supabaseService.getSupabaseClient();
    if (!client) return null;

    const {
      data: { session },
    } = await client.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Clears developer portal state.
   * Note: Supabase logout is handled by UserService.logout()
   */
  logout(): void {
    this.isAuthenticatedSubject.next(false);
    this.dashboard.set(null);
  }

  // ============ DASHBOARD ============

  /**
   * Fetches dashboard data for the authenticated developer.
   * Uses Supabase Auth token or falls back to legacy token.
   */
  getDashboard(): Observable<DeveloperDashboard> {
    return from(this.getAuthToken()).pipe(
      switchMap((token) => {
        if (!token) {
          throw new Error('Not authenticated');
        }
        return this.http.get<DeveloperDashboard>(
          `${this.config.apiUrl}/developers/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }),
      tap((data) => {
        this.dashboard.set(data);
      })
    );
  }

  // ============ API KEY MANAGEMENT ============

  /**
   * Rotates the API key. The new key is only shown once.
   * Uses Supabase Auth token or falls back to legacy token.
   */
  rotateApiKey(): Observable<ApiKeyRotationResponse> {
    return from(this.getAuthToken()).pipe(
      switchMap((token) => {
        if (!token) {
          throw new Error('Not authenticated');
        }
        return this.http.post<ApiKeyRotationResponse>(
          `${this.config.apiUrl}/developers/api-key/rotate`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      })
    );
  }

  // ============ SUBSCRIPTION ============

  /**
   * Gets the current subscription status.
   */
  getSubscriptionStatus(): Observable<{ status: ApiSubscriptionStatus }> {
    return from(this.getAuthToken()).pipe(
      switchMap((token) => {
        if (!token) {
          throw new Error('Not authenticated');
        }
        return this.http.get<{ status: ApiSubscriptionStatus }>(
          `${this.config.apiUrl}/developers/subscription/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      })
    );
  }

  /**
   * Cancels the subscription.
   */
  cancelSubscription(): Observable<SubscriptionCancelResponse> {
    return from(this.getAuthToken()).pipe(
      switchMap((token) => {
        if (!token) {
          throw new Error('Not authenticated');
        }
        return this.http.post<SubscriptionCancelResponse>(
          `${this.config.apiUrl}/developers/subscription/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      })
    );
  }

}
