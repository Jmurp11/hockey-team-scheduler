import { CreateGame } from '../types/game.type';

/**
 * Generates an array of dates between start and end date (inclusive)
 */
export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Array.from({ length: diffDays + 1 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

/**
 * Parses tournament location string into city and state components
 */
export function parseTournamentLocation(location: string): {
  city: string;
  state: string;
  country: string;
} {
  const parts = location.split(',').map((part: string) => part.trim());
  return {
    city: parts[0] || '',
    state: parts[1] || '',
    country: parts[2] || 'USA',
  };
}

/**
 * Creates game info object for a tournament
 */
export function createTournamentGameInfo(
  tournament: any,
  userId: number
): Omit<CreateGame, 'date'> {
  const location = parseTournamentLocation(tournament.location);

  return {
    rink: tournament.rink,
    city: location.city,
    state: location.state,
    country: location.country || 'USA',
    time: '12:00:00',
    opponent: -1,
    gameType: 'tournament',
    isHome: false,
    user: userId,
  };
}

/**
 * Opens tournament registration URL in a new window/tab
 */
export function registerForTournament(tournament: any): void {
  if (tournament.registrationUrl) {
    window.open(tournament.registrationUrl, '_blank');
  }
}
