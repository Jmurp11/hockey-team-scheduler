import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  EvaluateTournamentFitRequest,
  EvaluateTournamentFitResponse,
} from '@hockey-team-scheduler/shared-utilities';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

/**
 * Service for evaluating tournament fit for a team.
 * Calls the Tournament Fit Agent API to get recommendations based on
 * team rating, schedule, and travel constraints.
 */
@Injectable({ providedIn: 'root' })
export class TournamentFitService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  /**
   * Evaluates how well tournaments fit a team's profile.
   *
   * @param request - The evaluation request containing team, user, and association IDs
   * @returns Observable with tournaments sorted by fit score and recommendations
   *
   * @example
   * ```typescript
   * this.tournamentFitService.evaluateFit({
   *   teamId: 1234,
   *   userId: 'abc-123',
   *   associationId: 4918,
   * }).subscribe(response => {
   *   console.log('Recommended:', response.recommended);
   *   console.log('All tournaments:', response.tournaments);
   * });
   * ```
   */
  evaluateFit(
    request: EvaluateTournamentFitRequest,
  ): Observable<EvaluateTournamentFitResponse> {
    return this.http.post<EvaluateTournamentFitResponse>(
      `${this.config.apiUrl}/tournaments/evaluate-fit`,
      request,
    );
  }

  /**
   * Evaluates fit for specific tournaments by ID.
   *
   * @param teamId - Team ID to evaluate fit for
   * @param userId - User ID for fetching schedule
   * @param associationId - Association ID for location calculation
   * @param tournamentIds - Specific tournament IDs to evaluate
   * @returns Observable with fit evaluations for the specified tournaments
   */
  evaluateFitForTournaments(
    teamId: number,
    userId: string,
    associationId: number,
    tournamentIds: string[],
  ): Observable<EvaluateTournamentFitResponse> {
    return this.evaluateFit({
      teamId,
      userId,
      associationId,
      tournamentIds,
    });
  }
}
