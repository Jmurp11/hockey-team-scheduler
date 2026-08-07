import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import {
  Game,
  ScheduleRisk,
  ScheduleRiskEvaluation,
} from '@hockey-team-scheduler/shared-utilities';
import { APP_CONFIG } from '../config/app-config';
import { AuthService } from './auth.service';
import { ScheduleService } from './schedule.service';

/**
 * Service for managing schedule risk evaluation state.
 *
 * Automatically subscribes to the current user's games on initialization
 * and re-evaluates risks on page load and after any schedule mutation
 * (via Supabase realtime).
 *
 * Evaluation itself runs on the API (`POST /schedule-risk/evaluate`); this
 * service only holds the resulting state. The scoring engine used to run in
 * the browser, which made its thresholds client-manipulable and meant a rule
 * change needed a new web and mobile bundle. It now sits in `shared-domain`
 * and is executed server-side, matching tournament-fit.
 *
 * The signal surface below is unchanged from the client-side version, so
 * consumers (`schedule-risk-badge`, `schedule-risk-notification`, and both
 * schedule screens) did not need to change.
 *
 * It uses Angular signals for reactive state management, compatible with
 * zoneless change detection.
 *
 * The service is advisory only - it detects and reports risks but never
 * blocks any actions or auto-fixes issues.
 *
 * @example
 * ```typescript
 * // Inject the service
 * private scheduleRiskService = inject(ScheduleRiskService);
 *
 * // Access risk state in template (no manual evaluate() needed)
 * @if (scheduleRiskService.hasRisks()) {
 *   <app-schedule-risk-badge [evaluation]="scheduleRiskService.evaluation()" />
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ScheduleRiskService {
  private readonly authService = inject(AuthService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);


  // Private signals for internal state
  private readonly _evaluation = signal<ScheduleRiskEvaluation | null>(null);
  private readonly _isEvaluating = signal(false);
  private readonly _lastEvaluatedAt = signal<string | null>(null);

  // Public readonly signals for external access
  /** Current risk evaluation results, or null if not yet evaluated */
  readonly evaluation = this._evaluation.asReadonly();

  /** Whether evaluation is currently in progress */
  readonly isEvaluating = this._isEvaluating.asReadonly();

  /** Timestamp of last evaluation, or null if not yet evaluated */
  readonly lastEvaluatedAt = this._lastEvaluatedAt.asReadonly();

  // Computed values for convenient template binding
  /** Total number of detected risks */
  readonly totalRisks = computed(() => this._evaluation()?.totalRisks ?? 0);

  /** Whether there are any risks detected */
  readonly hasRisks = computed(() => this.totalRisks() > 0);

  /** Array of detected risks, sorted by severity */
  readonly risks = computed<ScheduleRisk[]>(
    () => this._evaluation()?.risks ?? [],
  );

  /** Count of error-severity risks */
  readonly errorCount = computed(
    () => this._evaluation()?.countBySeverity.error ?? 0,
  );

  /** Count of warning-severity risks */
  readonly warningCount = computed(
    () => this._evaluation()?.countBySeverity.warning ?? 0,
  );

  /** Count of info-severity risks */
  readonly infoCount = computed(
    () => this._evaluation()?.countBySeverity.info ?? 0,
  );

  /** Whether there are any error-severity risks */
  readonly hasErrors = computed(() => this.errorCount() > 0);

  /** Whether there are any warning-severity risks (but no errors) */
  readonly hasWarningsOnly = computed(
    () => !this.hasErrors() && this.warningCount() > 0,
  );

  constructor() {
    // Auto-subscribe to the current user's games.
    // gamesFull() includes Supabase realtime, so this fires on initial load
    // AND after any schedule mutation (INSERT/UPDATE/DELETE).
    toObservable(this.authService.currentUser)
      .pipe(
        switchMap((user) => {
          if (!user?.user_id) return of([]);
          return this.scheduleService.gamesFull(user.user_id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((games) => {
        this.evaluate(games);
      });
  }

  /**
   * Evaluate schedule risks for a set of games.
   * Call this after any schedule mutation (add, update, delete).
   *
   * Fire-and-forget by design: callers treat this as a state update, matching
   * the previous synchronous signature. Thresholds are no longer accepted —
   * they are server-owned, and no caller ever passed a custom config.
   *
   * @param games Array of games to evaluate
   */
  evaluate(games: Game[]): void {
    this._isEvaluating.set(true);

    this.http
      .post<ScheduleRiskEvaluation>(
        `${this.config.apiUrl}/schedule-risk/evaluate`,
        { games },
      )
      .pipe(
        catchError((error: unknown) => {
          console.error('Schedule risk evaluation failed:', error);
          // Graceful degradation - clear risks on error rather than showing
          // stale data. Matches the previous behaviour on a thrown engine error.
          return of(null);
        }),
      )
      .subscribe((result) => {
        this._evaluation.set(result);
        if (result) {
          this._lastEvaluatedAt.set(new Date().toISOString());
        }
        this._isEvaluating.set(false);
      });
  }

  /**
   * Clear all risk state.
   * Call this on logout or when switching context.
   */
  clear(): void {
    this._evaluation.set(null);
    this._lastEvaluatedAt.set(null);
  }
}
