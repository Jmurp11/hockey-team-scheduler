import { TournamentFitLabel } from '../types/tournament-fit.type';

/**
 * Shared display helpers for tournament fit badges across web and mobile.
 * These functions provide platform-agnostic data mappings.
 */

/**
 * Returns PrimeNG icon class for the given fit label.
 */
export function getFitLabelPrimeIcon(fitLabel: TournamentFitLabel): string {
  const iconMap: Record<TournamentFitLabel, string> = {
    'Good Fit': 'pi pi-check-circle',
    'Tight Schedule': 'pi pi-clock',
    'Travel Heavy': 'pi pi-car',
  };
  return iconMap[fitLabel] || 'pi pi-info-circle';
}

/**
 * Returns Ionicon name for the given fit label.
 */
export function getFitLabelIonIcon(fitLabel: TournamentFitLabel): string {
  const iconMap: Record<TournamentFitLabel, string> = {
    'Good Fit': 'checkmark-circle-outline',
    'Tight Schedule': 'time-outline',
    'Travel Heavy': 'car-outline',
  };
  return iconMap[fitLabel] || 'information-circle-outline';
}

/**
 * Returns a CSS-friendly color identifier for the fit label.
 * Maps to Ionic color names.
 */
export function getFitLabelColor(fitLabel: TournamentFitLabel): string {
  const colorMap: Record<TournamentFitLabel, string> = {
    'Good Fit': 'success',
    'Tight Schedule': 'warning',
    'Travel Heavy': 'primary',
  };
  return colorMap[fitLabel] || 'medium';
}
