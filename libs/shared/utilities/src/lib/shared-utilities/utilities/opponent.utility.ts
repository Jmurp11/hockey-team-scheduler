import { Ranking } from '../types/ranking.type';
import { SelectOption } from '../types/select-option.type';
import { setSelect } from './select.utility';

/**
 * Checks if a key is a stat key for opponent data
 */
export function isStatKey(key: string): boolean {
  return (
    key === 'agd' || key === 'record' || key === 'rating' || key === 'sched'
  );
}

/**
 * Assigns human-readable labels to opponent stat keys
 */
export function assignOpponentLabels(
  key: string,
  value: unknown,
): SelectOption<any> {
  switch (key) {
    case 'agd':
      return setSelect('Average Goal Diff', value);
    case 'record':
      return setSelect('Record', value);
    case 'rating':
      return setSelect('Rating', value);
    case 'sched':
      return setSelect('Strength of Schedule', value);
    default:
      return setSelect(key, value);
  }
}

/**
 * Gets card content for an opponent by filtering and mapping stat keys
 */
export function getOpponentCardContent(
  opponent: Ranking,
): SelectOption<string>[] {
  return Object.entries(opponent)
    .filter(([key]) => isStatKey(key))
    .map(([key, value]) =>
      assignOpponentLabels(key, value),
    ) as SelectOption<string>[];
}

/**
 * Handles parsing and extracting league abbreviations from opponent data
 */
export function handleLeagues(opponent: Ranking): string[] {
  if (!opponent.leagues || !Array.isArray(opponent.leagues)) {
    return [];
  }

  return opponent.leagues
    .map((leagueStr: string) => {
      try {
        const league = JSON.parse(leagueStr);
        return league.abbreviation;
      } catch (error) {
        console.error('Error parsing league:', leagueStr, error);
        return '';
      }
    })
    .filter((abbr: string) => abbr !== '');
}

export function handleNullOpponent(game: any) {
  if (!game.opponent) {
    return null;
  }

  const opponent = game.opponent[0];
  if (!opponent) {
    return game.opponent;
  }

  // Handle SelectOption format (has value property with id)
  if (opponent.value && opponent.value.id) {
    return opponent.value.id;
  }

  // Handle direct id property
  if (opponent.id) {
    return opponent.id;
  }

  return opponent;
}
