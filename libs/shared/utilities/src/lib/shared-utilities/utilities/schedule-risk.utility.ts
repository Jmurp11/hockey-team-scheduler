/**
 * Schedule Risk Detection Utility Functions
 *
 * Pure functions for detecting schedule conflicts and risks.
 * All functions are stateless and side-effect free for easy testing.
 */

import { Game } from '../types/game.type';
import {
  DEFAULT_SCHEDULE_RISK_CONFIG,
  ScheduleEvent,
  ScheduleEventReference,
  ScheduleRisk,
  ScheduleRiskConfig,
  ScheduleRiskEvaluation,
  ScheduleRiskSeverity,
  ScheduleRiskType,
} from '../types/schedule-risk.type';
import {
  convert24HourToMinutes,
  convertTo24HourFormat,
  formatTimeFromMinutes,
  removeTimeZoneInfo,
} from './time.utility';

/**
 * Generate a unique risk ID.
 */
function generateRiskId(): string {
  return `risk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract the date from a game object in YYYY-MM-DD format.
 */
function extractGameDate(game: Game): string {
  if (!game.date) return '';

  if (typeof game.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(game.date)) {
    return game.date;
  }

  const date = game.date instanceof Date ? game.date : new Date(game.date);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * Extract time from a game and convert to minutes since midnight.
 */
function extractGameTimeInMinutes(game: Game): number | null {
  if (!game.time) return null;

  try {
    const timeStr = game.time;
    let time24h: string | null = null;

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      time24h = convertTo24HourFormat(timeStr);
    } else if (timeStr.includes(':')) {
      const cleaned = removeTimeZoneInfo(timeStr);
      const parts = cleaned.split(':');
      if (parts.length >= 2) {
        time24h = `${parts[0]}:${parts[1]}`;
      }
    }

    if (!time24h) return null;

    const timeResult = convert24HourToMinutes(time24h);
    if (!timeResult) return null;

    const { hours, minutes } = timeResult;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }

    return null;
  } catch (error) {
    console.warn('Error parsing game time:', game.time, error);
    return null;
  }
}

/**
 * Get display name for a game (opponent name or tournament name).
 */
function getGameDisplayName(game: Game): string {
  if (game.opponent) {
    if (typeof game.opponent === 'object' && 'team_name' in game.opponent) {
      return game.opponent.team_name;
    }
    if (typeof game.opponent === 'object' && 'label' in game.opponent) {
      return (game.opponent as { label: string }).label;
    }
  }
  if (game.tournamentName) {
    return game.tournamentName;
  }
  return game.game_type || 'Game';
}

/**
 * Normalize a Game to ScheduleEvent format for comparison.
 */
function normalizeGameToEvent(game: Game): ScheduleEvent | null {
  const date = extractGameDate(game);
  const startTimeMinutes = extractGameTimeInMinutes(game);

  if (!date || startTimeMinutes === null) {
    return null;
  }

  return {
    id: game.id,
    type: 'game',
    displayName: getGameDisplayName(game),
    date,
    startTimeMinutes,
    venue: game.rink || '',
    city: game.city || '',
    state: game.state || '',
    country: game.country || '',
  };
}

/**
 * Create a ScheduleEventReference from a ScheduleEvent.
 */
function createEventReference(
  event: ScheduleEvent,
): ScheduleEventReference {
  return {
    id: event.id,
    type: event.type,
    displayName: event.displayName,
    date: event.date,
    time: formatTimeFromMinutes(event.startTimeMinutes),
    venue: event.venue,
    location: `${event.city}, ${event.state}`.replace(/^, |, $/g, ''),
  };
}

/**
 * Check if two events have a hard time conflict (overlapping times).
 */
function hasHardTimeConflict(
  event1: ScheduleEvent,
  event2: ScheduleEvent,
  config: ScheduleRiskConfig = DEFAULT_SCHEDULE_RISK_CONFIG,
): boolean {
  if (event1.date !== event2.date) return false;

  const gameDurationMinutes = config.assumedGameDurationHours * 60;

  const event1End =
    event1.endTimeMinutes ?? event1.startTimeMinutes + gameDurationMinutes;
  const event2End =
    event2.endTimeMinutes ?? event2.startTimeMinutes + gameDurationMinutes;

  // Check for overlap: event1 starts before event2 ends AND event2 starts before event1 ends
  return (
    event1.startTimeMinutes < event2End && event2.startTimeMinutes < event1End
  );
}

/**
 * Check if two events have a close start warning (within threshold hours).
 */
function hasCloseStartWarning(
  event1: ScheduleEvent,
  event2: ScheduleEvent,
  config: ScheduleRiskConfig = DEFAULT_SCHEDULE_RISK_CONFIG,
): boolean {
  if (event1.date !== event2.date) return false;

  const thresholdMinutes = config.closeStartThresholdHours * 60;
  const timeDifference = Math.abs(
    event1.startTimeMinutes - event2.startTimeMinutes,
  );

  // Close start warning if within threshold but NOT overlapping
  return (
    timeDifference < thresholdMinutes &&
    !hasHardTimeConflict(event1, event2, config)
  );
}

/**
 * Check if two events have same-day travel risk.
 * Different venues on same day with times that don't allow enough travel time.
 */
function hasSameDayTravelRisk(
  event1: ScheduleEvent,
  event2: ScheduleEvent,
  config: ScheduleRiskConfig = DEFAULT_SCHEDULE_RISK_CONFIG,
): boolean {
  if (event1.date !== event2.date) return false;

  // Same venue = no travel risk
  const sameVenue =
    event1.venue === event2.venue &&
    event1.city === event2.city &&
    event1.state === event2.state;

  if (sameVenue) return false;

  // Different venues - check if there's enough gap for travel
  const gameDurationMinutes = config.assumedGameDurationHours * 60;
  const travelBuffer = config.travelTimeThresholdMinutes;

  // Determine which event is first
  const [first, second] =
    event1.startTimeMinutes <= event2.startTimeMinutes
      ? [event1, event2]
      : [event2, event1];

  const firstEndTime =
    first.endTimeMinutes ?? first.startTimeMinutes + gameDurationMinutes;
  const gapBetweenEvents = second.startTimeMinutes - firstEndTime;

  // If gap is less than travel threshold, there's a travel risk
  // But only if they don't already have a hard conflict or close start warning
  return (
    gapBetweenEvents > 0 &&
    gapBetweenEvents < travelBuffer &&
    !hasHardTimeConflict(event1, event2, config) &&
    !hasCloseStartWarning(event1, event2, config)
  );
}

/**
 * Determine severity based on risk type.
 */
function getRiskSeverity(riskType: ScheduleRiskType): ScheduleRiskSeverity {
  switch (riskType) {
    case 'HARD_TIME_CONFLICT':
      return 'error';
    case 'CLOSE_START_WARNING':
      return 'warning';
    case 'SAME_DAY_TRAVEL_RISK':
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * Generate plain-English explanation for a risk.
 */
function generateRiskExplanation(
  riskType: ScheduleRiskType,
  events: ScheduleEvent[],
): string {
  const eventNames = events.map((e) => e.displayName).join(' and ');
  const times = events.map((e) => formatTimeFromMinutes(e.startTimeMinutes));

  switch (riskType) {
    case 'HARD_TIME_CONFLICT':
      return `${eventNames} are scheduled at overlapping times (${times.join(' and ')}) on ${events[0].date}. One of these events cannot be attended.`;

    case 'CLOSE_START_WARNING':
      return `${eventNames} are scheduled within 2 hours of each other (${times.join(' and ')}) on ${events[0].date}. This may be a tight turnaround.`;

    case 'SAME_DAY_TRAVEL_RISK':
      const locations = events.map(
        (e) => `${e.venue} in ${e.city}`.replace(/ in $/g, ''),
      );
      return `${eventNames} are at different venues (${locations.join(' and ')}) on the same day with limited travel time between games.`;

    default:
      return `Schedule concern involving ${eventNames}.`;
  }
}

/**
 * Generate suggestion text for a risk.
 */
function generateRiskSuggestion(riskType: ScheduleRiskType): string {
  switch (riskType) {
    case 'HARD_TIME_CONFLICT':
      return 'Consider rescheduling one of these events to a different time or day.';

    case 'CLOSE_START_WARNING':
      return 'Ensure there is adequate time for rest, meals, and preparation between games.';

    case 'SAME_DAY_TRAVEL_RISK':
      return 'Plan transportation in advance and account for potential traffic delays.';

    default:
      return 'Review your schedule to ensure it works for your team.';
  }
}

/**
 * Create a ScheduleRisk object from detected conflict.
 */
function createScheduleRisk(
  riskType: ScheduleRiskType,
  events: ScheduleEvent[],
): ScheduleRisk {
  return {
    id: generateRiskId(),
    riskType,
    severity: getRiskSeverity(riskType),
    affectedEvents: events.map(createEventReference),
    explanation: generateRiskExplanation(riskType, events),
    suggestion: generateRiskSuggestion(riskType),
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Group events by date for efficient pairwise comparison.
 */
function groupEventsByDate(
  events: ScheduleEvent[],
): Map<string, ScheduleEvent[]> {
  const grouped = new Map<string, ScheduleEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.date) || [];
    existing.push(event);
    grouped.set(event.date, existing);
  }

  return grouped;
}

/**
 * Sort risks by severity (errors first, then warnings, then info).
 */
function sortRisksBySeverity(risks: ScheduleRisk[]): ScheduleRisk[] {
  const severityOrder: Record<ScheduleRiskSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };

  return [...risks].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}

/**
 * Create a unique key for a risk to detect duplicates.
 */
function createRiskKey(risk: ScheduleRisk): string {
  const eventIds = risk.affectedEvents
    .map((e) => e.id)
    .sort()
    .join('|');
  return `${risk.riskType}:${eventIds}`;
}

/**
 * Filter out duplicate risks (same events, same type).
 */
function deduplicateRisks(risks: ScheduleRisk[]): ScheduleRisk[] {
  const seen = new Set<string>();
  const unique: ScheduleRisk[] = [];

  for (const risk of risks) {
    const key = createRiskKey(risk);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(risk);
    }
  }

  return unique;
}

/**
 * Check if a date is in the future (exclude past games only).
 */
function isFutureOrToday(dateStr: string): boolean {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return eventDate >= today;
}

/**
 * Main evaluation function - analyze full schedule for risks.
 * This is the primary entry point.
 */
function evaluateScheduleRisks(
  events: ScheduleEvent[],
  config: ScheduleRiskConfig = DEFAULT_SCHEDULE_RISK_CONFIG,
): ScheduleRiskEvaluation {
  const risks: ScheduleRisk[] = [];

  // Filter to future events only (no reason to warn about past games)
  const relevantEvents = events.filter((e) => isFutureOrToday(e.date));

  // Group events by date for efficient comparison
  const eventsByDate = groupEventsByDate(relevantEvents);

  // For each date with 2+ events, check all pairs
  for (const [, dayEvents] of eventsByDate) {
    if (dayEvents.length < 2) continue;

    // Compare all pairs of events on this day
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const event1 = dayEvents[i];
        const event2 = dayEvents[j];

        // Check for hard time conflict (highest priority)
        if (hasHardTimeConflict(event1, event2, config)) {
          risks.push(createScheduleRisk('HARD_TIME_CONFLICT', [event1, event2]));
          continue; // Skip other checks if there's a hard conflict
        }

        // Check for close start warning
        if (hasCloseStartWarning(event1, event2, config)) {
          risks.push(createScheduleRisk('CLOSE_START_WARNING', [event1, event2]));
          continue; // Skip travel check if close start
        }

        // Check for same-day travel risk
        if (hasSameDayTravelRisk(event1, event2, config)) {
          risks.push(createScheduleRisk('SAME_DAY_TRAVEL_RISK', [event1, event2]));
        }
      }
    }
  }

  // Deduplicate and sort
  const uniqueRisks = deduplicateRisks(risks);
  const sortedRisks = sortRisksBySeverity(uniqueRisks);

  // Count by severity
  const countBySeverity = {
    error: sortedRisks.filter((r) => r.severity === 'error').length,
    warning: sortedRisks.filter((r) => r.severity === 'warning').length,
    info: sortedRisks.filter((r) => r.severity === 'info').length,
  };

  return {
    risks: sortedRisks,
    totalRisks: sortedRisks.length,
    countBySeverity,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate risks from an array of games.
 * Convenience function that normalizes games first.
 */
export function evaluateGameScheduleRisks(
  games: Game[],
  config: ScheduleRiskConfig = DEFAULT_SCHEDULE_RISK_CONFIG,
): ScheduleRiskEvaluation {
  const events = games
    .map(normalizeGameToEvent)
    .filter((e): e is ScheduleEvent => e !== null);

  return evaluateScheduleRisks(events, config);
}
