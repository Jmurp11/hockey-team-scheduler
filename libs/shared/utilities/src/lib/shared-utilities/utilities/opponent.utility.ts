import { setSelect } from './select.utility';

export interface CardContent {
  label: string;
  value: string;
}

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
): { label: string; value: unknown } {
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
export function getOpponentCardContent(opponent: any): CardContent[] {
  return Object.entries(opponent)
    .filter(([key]) => isStatKey(key))
    .map(([key, value]) => assignOpponentLabels(key, value)) as CardContent[];
}

/**
 * Handles parsing and extracting league abbreviations from opponent data
 */
export function handleLeagues(opponent: any): string[] {
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

  return game.opponent[0] ? game.opponent[0].id : game.opponent;
}
