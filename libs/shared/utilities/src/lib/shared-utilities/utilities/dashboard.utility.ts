/**
 * Utility functions for Dashboard components.
 * These functions contain shared business logic used by both web and mobile apps.
 */

// ============================================
// Strength of Schedule Utilities
// ============================================

/**
 * Strength of schedule classification.
 */
export type StrengthClassification = 'strong' | 'moderate' | 'weak';

/**
 * Get the strength of schedule classification based on team rating comparison.
 *
 * The classification is based on comparing the team's strength of schedule (SOS)
 * to their own rating:
 * - Strong: SOS > teamRating + 2.5 (playing tougher opponents)
 * - Weak: SOS < teamRating - 3 (playing easier opponents)
 * - Moderate: within -3 to +2.5 of team rating
 *
 * @param strengthOfSchedule The average rating of opponents played (typically 50-100)
 * @param teamRating The team's own rating
 */
export function getStrengthOfScheduleClassification(
  strengthOfSchedule: number,
  teamRating: number
): StrengthClassification {
  const difference = strengthOfSchedule - teamRating;

  if (difference > 2.5) {
    return 'strong';
  }
  if (difference < -3) {
    return 'weak';
  }
  return 'moderate';
}

/**
 * Get a human-readable label for strength of schedule classification.
 */
export function getStrengthOfScheduleLabel(classification: StrengthClassification): string {
  switch (classification) {
    case 'strong':
      return 'Strong';
    case 'moderate':
      return 'Moderate';
    case 'weak':
      return 'Weak';
  }
}

// ============================================
// Goal Differential Utilities
// ============================================

/**
 * Goal differential classification.
 */
export type DifferentialClassification = 'positive' | 'neutral' | 'negative';

/**
 * Get the classification for goal differential.
 */
export function getGoalDifferentialClassification(differential: number): DifferentialClassification {
  if (differential > 0) return 'positive';
  if (differential < 0) return 'negative';
  return 'neutral';
}

/**
 * Format goal differential with appropriate sign prefix.
 * @param differential The average goal differential
 * @param decimals Number of decimal places (default: 1)
 */
export function formatGoalDifferential(differential: number, decimals: number = 1): string {
  const formatted = Math.abs(differential).toFixed(decimals);
  if (differential > 0) return `+${formatted}`;
  if (differential < 0) return `-${formatted}`;
  return formatted;
}

// ============================================
// Game Slots Utilities
// ============================================

/**
 * Game slots classification.
 */
export type GameSlotsClassification = 'has-slots' | 'no-slots';

/**
 * Get the classification for game slots.
 */
export function getGameSlotsClassification(openSlots: number): GameSlotsClassification {
  return openSlots > 0 ? 'has-slots' : 'no-slots';
}

/**
 * Check if there are open game slots.
 */
export function hasOpenGameSlots(openSlots: number): boolean {
  return openSlots > 0;
}

// ============================================
// Dashboard Data Loading Utilities
// ============================================

/**
 * Check if user has a team assigned and can load dashboard.
 */
export function canLoadDashboard(user: { team_id?: number | null } | null | undefined): boolean {
  return !!user && !!user.team_id;
}
