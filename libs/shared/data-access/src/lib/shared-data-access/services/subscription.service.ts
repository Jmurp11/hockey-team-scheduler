import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CheckoutSessionResponse,
  CreateSubscriptionCheckoutDto,
  SubscriptionCheckoutStatus,
} from '@hockey-team-scheduler/shared-utilities';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

/**
 * Service for handling subscription checkout operations.
 * Creates Stripe Checkout Sessions for subscription plans.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  /**
   * Creates a Stripe Checkout Session for a subscription plan.
   * Returns the checkout URL for redirecting the user to Stripe.
   *
   * @param dto - The checkout request containing plan, email, and redirect URLs
   * @returns Observable with sessionId and checkout URL
   */
  createCheckout(dto: CreateSubscriptionCheckoutDto): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.config.apiUrl}/users/subscriptions/checkout`,
      dto,
    );
  }

  /**
   * Retrieves the status of a Stripe Checkout Session.
   * Used to verify payment status after redirect from Stripe.
   *
   * @param sessionId - The Stripe session ID from the redirect URL
   * @returns Observable with session status, customer email, and plan
   */
  getCheckoutStatus(sessionId: string): Observable<SubscriptionCheckoutStatus> {
    return this.http.get<SubscriptionCheckoutStatus>(
      `${this.config.apiUrl}/users/subscriptions/checkout/${sessionId}`,
    );
  }
}
