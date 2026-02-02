/**
 * Tournament Fit Agent Types
 *
 * Types and interfaces for evaluating how well a tournament fits a team's
 * schedule, rating, and travel constraints.
 */

/**
 * Fit label indicating how well a tournament matches a team's profile.
 * - "Good Fit": Strong rating match, minimal schedule conflict, reasonable travel
 * - "Tight Schedule": Rating OK but may conflict with existing games or dense schedule
 * - "Travel Heavy": Good fit otherwise but requires significant travel
 */
export type TournamentFitLabel = 'Good Fit' | 'Tight Schedule' | 'Travel Heavy';

/**
 * Detailed fit scores for each evaluation dimension.
 * Scores range from 0-100 where higher is better.
 */
export interface TournamentFitScores {
  /** How well the tournament level matches the team's rating (0-100) */
  ratingFit: number;
  /** How well the dates fit with the team's schedule (0-100) */
  scheduleAvailability: number;
  /** How reasonable the travel distance is (0-100) */
  travelScore: number;
  /** Overall schedule density around tournament dates (0-100) */
  scheduleDensity: number;
}

/**
 * Complete tournament fit evaluation result.
 */
export interface TournamentFitEvaluation {
  /** Tournament ID this evaluation is for */
  tournamentId: string;
  /** Overall fit label */
  fitLabel: TournamentFitLabel;
  /** Plain-English explanation of the fit assessment */
  explanation: string;
  /** Detailed scores for each dimension */
  scores: TournamentFitScores;
  /** Overall fit score (0-100) */
  overallScore: number;
  /** Whether the team has any schedule conflicts during tournament dates */
  hasScheduleConflict: boolean;
  /** Number of days around the tournament that already have games */
  gamesNearby: number;
}

/**
 * Extended tournament type with fit evaluation data.
 */
export interface TournamentWithFit {
  /** Tournament ID */
  id: string;
  /** Tournament name */
  name: string;
  /** Tournament location */
  location: string;
  /** Start date (ISO string) */
  startDate: string;
  /** End date (ISO string) */
  endDate: string;
  /** Registration URL */
  registrationUrl: string;
  /** Tournament description */
  description: string;
  /** Rink name */
  rink: string | null;
  /** Age groups (primary field) */
  age: string[] | null;
  /** Skill levels (primary field) */
  level: string[] | null;
  /** Age groups (alternative field from nearby tournaments RPC) */
  ages?: string[] | null;
  /** Skill levels (alternative field from nearby tournaments RPC) */
  levels?: string[] | null;
  /** Distance from team's home (miles) */
  distance?: number;
  /** Whether this is a featured tournament */
  featured?: boolean;
  /** Fit evaluation results (only present for authenticated users) */
  fit?: TournamentFitEvaluation;
}

/**
 * Request DTO for evaluating tournament fit.
 */
export interface EvaluateTournamentFitRequest {
  /** Team ID to evaluate fit for */
  teamId: number;
  /** User ID (for fetching schedule) */
  userId: string;
  /** Association ID (for location/distance calculation) */
  associationId: number;
  /** Optional: specific tournament IDs to evaluate (if not provided, evaluates all nearby) */
  tournamentIds?: string[];
}

/**
 * Response DTO for tournament fit evaluation.
 */
export interface EvaluateTournamentFitResponse {
  /** Tournaments with fit evaluations, sorted by overall fit score */
  tournaments: TournamentWithFit[];
  /** Tournaments that are recommended (Good Fit label) */
  recommended: TournamentWithFit[];
}