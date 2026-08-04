import { Injectable } from '@nestjs/common';
import {
  DEFAULT_SCHEDULE_RISK_CONFIG,
  Game,
  ScheduleRiskEvaluation,
  evaluateGameScheduleRisks,
} from '@hockey-team-scheduler/shared-domain';

/**
 * Server-side schedule risk evaluation.
 *
 * The scoring engine itself is unchanged — it moved from the browser into
 * `shared-domain` so both the Angular clients and this API consume one
 * implementation. Running it here makes the thresholds authoritative rather
 * than client-manipulable, and lets rule changes ship without a new web and
 * mobile bundle. This mirrors tournament-fit, which was already server-side.
 *
 * Advisory only: it reports risks, it never blocks or auto-fixes anything.
 */
@Injectable()
export class ScheduleRiskService {
  /**
   * Evaluate a set of games for scheduling conflicts.
   *
   * Thresholds are deliberately server-owned. `evaluateGameScheduleRisks`
   * accepts a config override, but no caller has ever passed one, so the
   * default is applied here and not exposed through the API surface.
   */
  evaluate(games: Game[]): ScheduleRiskEvaluation {
    return evaluateGameScheduleRisks(games, DEFAULT_SCHEDULE_RISK_CONFIG);
  }
}
