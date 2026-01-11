import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import {
  CreateDeveloperCheckoutDto,
  DeveloperCheckoutResponse,
  DeveloperCheckoutStatus,
  DeveloperMagicLinkDto,
  DeveloperAuthToken,
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
 * - Magic link authentication
 * - Session management (token storage/retrieval)
 * - Dashboard data fetching
 * - API key rotation
 * - Subscription management
 *
 * SESSION MANAGEMENT:
 * - Tokens are stored in localStorage
 * - Token presence indicates authenticated state
 * - Tokens expire after 7 days
 */
@Injectable({ providedIn: 'root' })
export class DeveloperPortalService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private readonly TOKEN_KEY = 'developer_token';
  private readonly TOKEN_EXPIRY_KEY = 'developer_token_expiry';

  // Authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Dashboard data signal for reactive updates
  dashboard = signal<DeveloperDashboard | null>(null);

  constructor() {
    // Check token validity on service initialization
    this.checkTokenValidity();
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
   * Requests a magic link for authentication.
   */
  requestMagicLink(dto: DeveloperMagicLinkDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.config.apiUrl}/developers/auth/magic-link`,
      dto
    );
  }

  /**
   * Verifies a magic link token and stores the session token.
   */
  verifyMagicLink(token: string): Observable<DeveloperAuthToken> {
    return this.http
      .post<DeveloperAuthToken>(`${this.config.apiUrl}/developers/auth/verify`, { token })
      .pipe(
        tap((response) => {
          this.setToken(response.token, response.expiresAt);
        })
      );
  }

  /**
   * Checks if user is authenticated.
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Gets the stored authentication token.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Logs out the user by clearing the stored token.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    this.isAuthenticatedSubject.next(false);
    this.dashboard.set(null);
  }

  /**
   * Stores the authentication token.
   */
  private setToken(token: string, expiresAt: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiresAt);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Checks if a valid token exists.
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (!token || !expiry) {
      return false;
    }

    // Check if token has expired
    const expiryDate = new Date(expiry);
    if (expiryDate <= new Date()) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Validates token on service init.
   */
  private checkTokenValidity(): void {
    if (!this.hasValidToken()) {
      this.logout();
    }
  }

  // ============ DASHBOARD ============

  /**
   * Fetches dashboard data for the authenticated developer.
   */
  getDashboard(): Observable<DeveloperDashboard> {
    return this.http
      .get<DeveloperDashboard>(`${this.config.apiUrl}/developers/dashboard`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((data) => {
          this.dashboard.set(data);
        })
      );
  }

  // ============ API KEY MANAGEMENT ============

  /**
   * Rotates the API key. The new key is only shown once.
   */
  rotateApiKey(): Observable<ApiKeyRotationResponse> {
    return this.http.post<ApiKeyRotationResponse>(
      `${this.config.apiUrl}/developers/api-key/rotate`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // ============ SUBSCRIPTION ============

  /**
   * Gets the current subscription status.
   */
  getSubscriptionStatus(): Observable<{ status: ApiSubscriptionStatus }> {
    return this.http.get<{ status: ApiSubscriptionStatus }>(
      `${this.config.apiUrl}/developers/subscription/status`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Cancels the subscription.
   */
  cancelSubscription(): Observable<SubscriptionCancelResponse> {
    return this.http.post<SubscriptionCancelResponse>(
      `${this.config.apiUrl}/developers/subscription/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // ============ HELPERS ============

  /**
   * Gets authorization headers for authenticated requests.
   */
  private getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
