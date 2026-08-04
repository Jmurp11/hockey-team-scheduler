import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import {
  evaluateGameScheduleRisks,
  Game,
  ScheduleRisk,
  ScheduleRiskConfig,
  ScheduleRiskEvaluation,
} from '@hockey-team-scheduler/shared-utilities';
import { AuthService } from './auth.service';
import { ScheduleService } from './schedule.service';

/**
 * Service for managing schedule risk evaluation state.
 *
 * Automatically subscribes to the current user's games on initialization
 * and re-evaluates risks on page load and after any schedule mutation
 * (via Supabase realtime).
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
   * @param games Array of games to evaluate
   * @param config Optional custom configuration for risk thresholds
   */
  evaluate(games: Game[], config?: ScheduleRiskConfig): void {
    this._isEvaluating.set(true);

    try {
      const result = evaluateGameScheduleRisks(games, config);

      this._evaluation.set(result);
      this._lastEvaluatedAt.set(new Date().toISOString());
    } catch (error) {
      console.error('Schedule risk evaluation failed:', error);
      // Graceful degradation - clear risks on error rather than showing stale data
      this._evaluation.set(null);
    } finally {
      this._isEvaluating.set(false);
    }
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
