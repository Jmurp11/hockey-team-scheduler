/**
 * Schedule Risk Monitor Types
 *
 * Types for detecting and displaying schedule conflicts and risks.
 * This feature is advisory only - it warns but never blocks actions.
 */

/**
 * Risk severity levels for visual display and sorting.
 * - "error": Critical conflicts that should be addressed (red)
 * - "warning": Potential issues to be aware of (yellow)
 * - "info": Minor concerns for consideration (blue)
 */
export type ScheduleRiskSeverity = 'error' | 'warning' | 'info';

/**
 * Types of schedule risks that can be detected.
 */
export type ScheduleRiskType =
  | 'HARD_TIME_CONFLICT' // Two events overlap in time
  | 'CLOSE_START_WARNING' // Events within 2 hours
  | 'SAME_DAY_TRAVEL_RISK'; // Same day, different venues, tight timing

/**
 * Identifies an event (game or tournament) involved in a risk.
 */
export interface ScheduleEventReference {
  /** Event ID */
  id: string;
  /** Event type */
  type: 'game' | 'tournament';
  /** Display name (opponent name or tournament name) */
  displayName: string;
  /** Event date (YYYY-MM-DD) */
  date: string;
  /** Event time (HH:MM format) */
  time: string;
  /** Venue/rink name */
  venue: string;
  /** Location (city, state) */
  location: string;
}

/**
 * A detected schedule risk.
 */
export interface ScheduleRisk {
  /** Unique identifier for this risk instance */
  id: string;
  /** Type of risk */
  riskType: ScheduleRiskType;
  /** Severity level for display */
  severity: ScheduleRiskSeverity;
  /** Events involved in this risk */
  affectedEvents: ScheduleEventReference[];
  /** Plain-English explanation of the risk */
  explanation: string;
  /** Suggested next steps (text only, no auto-actions) */
  suggestion: string;
  /** When this risk was detected (ISO timestamp) */
  detectedAt: string;
}

/**
 * Result of a schedule risk evaluation.
 */
export interface ScheduleRiskEvaluation {
  /** List of detected risks, sorted by severity */
  risks: ScheduleRisk[];
  /** Total count of risks */
  totalRisks: number;
  /** Count by severity level */
  countBySeverity: {
    error: number;
    warning: number;
    info: number;
  };
  /** When evaluation was performed (ISO timestamp) */
  evaluatedAt: string;
}

/**
 * Configuration for risk detection thresholds.
 */
export interface ScheduleRiskConfig {
  /** Minimum gap (hours) before triggering CLOSE_START_WARNING */
  closeStartThresholdHours: number;
  /** Assumed game duration (hours) for overlap detection */
  assumedGameDurationHours: number;
  /** Travel time threshold (minutes) for SAME_DAY_TRAVEL_RISK */
  travelTimeThresholdMinutes: number;
}

/**
 * Default configuration values for schedule risk detection.
 */
export const DEFAULT_SCHEDULE_RISK_CONFIG: ScheduleRiskConfig = {
  closeStartThresholdHours: 2, // Games within 2 hours trigger warning
  assumedGameDurationHours: 1.5, // Assume 1.5 hour game duration
  travelTimeThresholdMinutes: 30, // 30+ minutes travel triggers risk
};

/**
 * Normalized event format for risk evaluation.
 * Used internally to compare games and tournaments uniformly.
 */
export interface ScheduleEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: 'game' | 'tournament';
  /** Display name for the event */
  displayName: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Start time in minutes since midnight */
  startTimeMinutes: number;
  /** End time in minutes since midnight (optional, calculated if not provided) */
  endTimeMinutes?: number;
  /** Venue/rink name */
  venue: string;
  /** City */
  city: string;
  /** State/province */
  state: string;
  /** Country */
  country: string;
}
