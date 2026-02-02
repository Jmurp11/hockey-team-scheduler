import { ScheduleRiskSeverity, ScheduleRiskType } from '../types/schedule-risk.type';

/**
 * Shared display helpers for schedule risk badges across web and mobile.
 * These functions provide platform-agnostic data mappings.
 */

/**
 * Returns a human-readable label for the risk type.
 */
export function getRiskTypeLabel(riskType: ScheduleRiskType): string {
  const labels: Record<ScheduleRiskType, string> = {
    HARD_TIME_CONFLICT: 'Time Conflict',
    CLOSE_START_WARNING: 'Back-to-Back Games',
    SAME_DAY_TRAVEL_RISK: 'Travel Risk',
  };
  return labels[riskType] || riskType;
}

/**
 * Returns PrimeNG icon class for the given severity level.
 */
export function getRiskSeverityPrimeIcon(severity: ScheduleRiskSeverity): string {
  const iconMap: Record<ScheduleRiskSeverity, string> = {
    error: 'pi pi-times-circle',
    warning: 'pi pi-exclamation-triangle',
    info: 'pi pi-info-circle',
  };
  return iconMap[severity] || 'pi pi-info-circle';
}

/**
 * Returns Ionicon name for the given severity level.
 */
export function getRiskSeverityIonIcon(severity: ScheduleRiskSeverity): string {
  const iconMap: Record<ScheduleRiskSeverity, string> = {
    error: 'close-circle-outline',
    warning: 'warning-outline',
    info: 'information-circle-outline',
  };
  return iconMap[severity] || 'information-circle-outline';
}

/**
 * Returns the Ionicon name for an event type.
 */
export function getRiskEventIonIcon(eventType: 'game' | 'tournament'): string {
  return eventType === 'game' ? 'calendar-outline' : 'trophy-outline';
}

/**
 * Returns the CSS color class name for a severity level.
 */
export function getRiskSeverityColor(severity: ScheduleRiskSeverity): string {
  const colorMap: Record<ScheduleRiskSeverity, string> = {
    error: 'danger',
    warning: 'warning',
    info: 'primary',
  };
  return colorMap[severity] || 'primary';
}

/**
 * Formats the risk count label text.
 */
export function getRiskCountLabel(totalRisks: number): string {
  return `${totalRisks} Schedule Risk${totalRisks !== 1 ? 's' : ''}`;
}
