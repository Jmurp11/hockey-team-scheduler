import { CreateGame } from '../types/game.type';
import { Tournament } from '../types/tournament.type';
import { SortDirection } from '../types/sort.type';

/**
 * Enum representing tournament filter options.
 * Used to filter tournament lists by featured status.
 */
export type TournamentFilterType = 'all' | 'featured';

/**
 * Sorts tournaments with featured tournaments first, then by the specified field.
 * This ensures featured tournaments always appear at the top of lists while
 * maintaining secondary sorting within each group.
 *
 * @param tournaments - Array of tournaments to sort
 * @param sortField - Field to sort by (e.g., 'distance', 'startDate')
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @returns Sorted array with featured tournaments first
 */
export function sortTournamentsWithFeaturedFirst<T extends { featured?: boolean }>(
  tournaments: T[],
  sortField: keyof T,
  sortDirection: SortDirection = 'asc'
): T[] {
  return [...tournaments].sort((a, b) => {
    // Featured tournaments always come first
    const aFeatured = a.featured ?? false;
    const bFeatured = b.featured ?? false;

    if (aFeatured !== bFeatured) {
      return bFeatured ? 1 : -1;
    }

    // Secondary sort by the specified field
    const fieldA = a[sortField];
    const fieldB = b[sortField];

    // Handle null/undefined values
    if (fieldA == null && fieldB == null) return 0;
    if (fieldA == null) return sortDirection === 'asc' ? 1 : -1;
    if (fieldB == null) return sortDirection === 'asc' ? -1 : 1;

    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filters tournaments by featured status.
 *
 * @param tournaments - Array of tournaments to filter
 * @param filterType - Filter type ('all' or 'featured')
 * @returns Filtered array of tournaments
 */
export function filterTournamentsByType<T extends { featured?: boolean }>(
  tournaments: T[],
  filterType: TournamentFilterType
): T[] {
  if (filterType === 'featured') {
    return tournaments.filter((t) => t.featured === true);
  }
  return tournaments;
}

/**
 * Combined filter and sort function for tournaments.
 * Applies both filter and featured-first sorting in one operation.
 *
 * @param tournaments - Array of tournaments to process
 * @param filterType - Filter type ('all' or 'featured')
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction
 * @returns Filtered and sorted array
 */
export function filterAndSortTournaments<T extends { featured?: boolean }>(
  tournaments: T[],
  filterType: TournamentFilterType,
  sortField: keyof T,
  sortDirection: SortDirection = 'asc'
): T[] {
  const filtered = filterTournamentsByType(tournaments, filterType);
  return sortTournamentsWithFeaturedFirst(filtered, sortField, sortDirection);
}

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
  user_id: string,
  team_id?: number,
  association_id?: number,
): Omit<CreateGame, 'date'> {
  const location = parseTournamentLocation(tournament.location);

  return {
    rink: tournament.rink,
    city: location.city,
    state: location.state,
    country: location.country || 'USA',
    time: '12:00:00',
    opponent: -1,
    game_type: 'tournament',
    isHome: false,
    user: user_id,
    team: team_id as number,
    association: association_id as number,
    tournamentName: tournament.name,
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
