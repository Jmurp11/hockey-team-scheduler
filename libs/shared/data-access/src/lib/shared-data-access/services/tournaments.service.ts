import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CheckoutSessionResponse,
  CreateFeaturedCheckoutDto,
  CreateTournamentDto,
  NearbyTournamentsParams,
  Tournament,
  VerifyPaymentDto,
} from '@hockey-team-scheduler/shared-utilities';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class TournamentsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  /**
   * Fetches all tournaments (requires authentication).
   */
  tournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.config.apiUrl}/tournaments`);
  }

  /**
   * Fetches all public tournaments for display.
   * Featured tournaments are returned first, then sorted by date.
   */
  publicTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.config.apiUrl}/tournaments/public`);
  }

  /**
   * Fetches tournaments near a specific association.
   */
  nearByTournaments(params: NearbyTournamentsParams): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.config.apiUrl}/tournaments/nearbyTournaments`, {
      params: {
        p_id: params.p_id.toString(),
      },
    });
  }

  /**
   * Creates a new tournament submission (free listing).
   * Used by tournament directors to submit their tournament for listing.
   */
  createTournament(dto: CreateTournamentDto): Observable<Tournament> {
    return this.http.post<Tournament>(
      `${this.config.apiUrl}/tournaments`,
      dto,
    );
  }

  /**
   * Creates a Stripe Checkout Session for a featured tournament listing.
   * Returns the checkout URL for redirecting the user to Stripe.
   */
  createFeaturedCheckout(dto: CreateFeaturedCheckoutDto): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.config.apiUrl}/tournaments/featured/checkout`,
      dto,
    );
  }

  /**
   * Verifies a Stripe payment and creates the featured tournament.
   * Called after successful redirect from Stripe Checkout.
   */
  verifyPaymentAndCreateTournament(dto: VerifyPaymentDto): Observable<Tournament> {
    return this.http.post<Tournament>(
      `${this.config.apiUrl}/tournaments/featured/verify-payment`,
      dto,
    );
  }
}
