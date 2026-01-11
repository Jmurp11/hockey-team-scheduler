import {
  sortTournamentsWithFeaturedFirst,
  filterTournamentsByType,
  filterAndSortTournaments,
  getDatesBetween,
  parseTournamentLocation,
  createTournamentGameInfo,
  registerForTournament,
  TournamentFilterType,
} from './tournament.utility';

describe('Tournament Utility Functions', () => {
  interface MockTournament {
    id: number;
    name: string;
    featured?: boolean;
    distance?: number;
    startDate?: string;
  }

  const mockTournaments: MockTournament[] = [
    { id: 1, name: 'Spring Championship', featured: true, distance: 10, startDate: '2024-03-15' },
    { id: 2, name: 'Summer Classic', featured: false, distance: 25, startDate: '2024-06-20' },
    { id: 3, name: 'Winter Invitational', featured: true, distance: 50, startDate: '2024-12-01' },
    { id: 4, name: 'Fall Tournament', featured: false, distance: 5, startDate: '2024-09-10' },
  ];

  describe('sortTournamentsWithFeaturedFirst', () => {
    it('should sort featured tournaments before non-featured', () => {
      const result = sortTournamentsWithFeaturedFirst(mockTournaments, 'name');

      // Featured tournaments should come first
      expect(result[0].featured).toBe(true);
      expect(result[1].featured).toBe(true);
      expect(result[2].featured).toBe(false);
      expect(result[3].featured).toBe(false);
    });

    it('should sort by specified field within featured group (ascending)', () => {
      const result = sortTournamentsWithFeaturedFirst(mockTournaments, 'distance', 'asc');

      // Featured tournaments sorted by distance ascending
      const featured = result.filter((t) => t.featured);
      expect(featured[0].distance).toBe(10);
      expect(featured[1].distance).toBe(50);
    });

    it('should sort by specified field within featured group (descending)', () => {
      const result = sortTournamentsWithFeaturedFirst(mockTournaments, 'distance', 'desc');

      const featured = result.filter((t) => t.featured);
      expect(featured[0].distance).toBe(50);
      expect(featured[1].distance).toBe(10);
    });

    it('should sort non-featured tournaments by specified field', () => {
      const result = sortTournamentsWithFeaturedFirst(mockTournaments, 'distance', 'asc');

      const nonFeatured = result.filter((t) => !t.featured);
      expect(nonFeatured[0].distance).toBe(5);
      expect(nonFeatured[1].distance).toBe(25);
    });

    it('should not mutate original array', () => {
      const original = [...mockTournaments];

      sortTournamentsWithFeaturedFirst(mockTournaments, 'name');

      expect(mockTournaments).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortTournamentsWithFeaturedFirst([], 'name');

      expect(result).toEqual([]);
    });

    it('should handle array with only featured tournaments', () => {
      const onlyFeatured = mockTournaments.filter((t) => t.featured);
      const result = sortTournamentsWithFeaturedFirst(onlyFeatured, 'distance', 'asc');

      expect(result.length).toBe(2);
      expect(result[0].distance).toBe(10);
    });

    it('should handle array with only non-featured tournaments', () => {
      const onlyNonFeatured = mockTournaments.filter((t) => !t.featured);
      const result = sortTournamentsWithFeaturedFirst(onlyNonFeatured, 'distance', 'asc');

      expect(result.length).toBe(2);
      expect(result[0].distance).toBe(5);
    });

    it('should handle null/undefined featured property', () => {
      const tournamentsWithMissingFeatured = [
        { id: 1, name: 'A', distance: 10 },
        { id: 2, name: 'B', featured: true, distance: 20 },
      ];

      const result = sortTournamentsWithFeaturedFirst(tournamentsWithMissingFeatured, 'distance');

      // Featured tournament should come first
      expect(result[0].featured).toBe(true);
    });

    it('should handle null/undefined sort field values', () => {
      const tournamentsWithNulls = [
        { id: 1, name: 'A', featured: false, distance: undefined },
        { id: 2, name: 'B', featured: false, distance: 10 },
      ];

      const result = sortTournamentsWithFeaturedFirst(tournamentsWithNulls, 'distance', 'asc');

      // Items with defined values should come before undefined in ascending
      expect(result[0].distance).toBe(10);
    });

    it('should sort by date field correctly', () => {
      const result = sortTournamentsWithFeaturedFirst(mockTournaments, 'startDate', 'asc');

      const featured = result.filter((t) => t.featured);
      expect(featured[0].startDate).toBe('2024-03-15');
      expect(featured[1].startDate).toBe('2024-12-01');
    });
  });

  describe('filterTournamentsByType', () => {
    it('should return all tournaments when filter is "all"', () => {
      const result = filterTournamentsByType(mockTournaments, 'all');

      expect(result.length).toBe(mockTournaments.length);
      expect(result).toEqual(mockTournaments);
    });

    it('should return only featured tournaments when filter is "featured"', () => {
      const result = filterTournamentsByType(mockTournaments, 'featured');

      expect(result.length).toBe(2);
      result.forEach((t) => {
        expect(t.featured).toBe(true);
      });
    });

    it('should handle empty array', () => {
      const result = filterTournamentsByType([], 'featured');

      expect(result).toEqual([]);
    });

    it('should return empty array when no featured tournaments exist', () => {
      const nonFeaturedOnly = mockTournaments.map((t) => ({ ...t, featured: false }));

      const result = filterTournamentsByType(nonFeaturedOnly, 'featured');

      expect(result).toEqual([]);
    });

    it('should not mutate original array', () => {
      const original = [...mockTournaments];

      filterTournamentsByType(mockTournaments, 'featured');

      expect(mockTournaments).toEqual(original);
    });
  });

  describe('filterAndSortTournaments', () => {
    it('should filter and sort in one operation', () => {
      const result = filterAndSortTournaments(
        mockTournaments,
        'all',
        'distance',
        'asc'
      );

      // Should be sorted with featured first, then by distance
      expect(result[0].featured).toBe(true);
      expect(result.length).toBe(mockTournaments.length);
    });

    it('should filter to featured only and sort', () => {
      const result = filterAndSortTournaments(
        mockTournaments,
        'featured',
        'distance',
        'asc'
      );

      expect(result.length).toBe(2);
      result.forEach((t) => expect(t.featured).toBe(true));
      expect(result[0].distance).toBe(10);
      expect(result[1].distance).toBe(50);
    });

    it('should use default ascending sort direction', () => {
      const result = filterAndSortTournaments(mockTournaments, 'all', 'distance');

      const featured = result.filter((t) => t.featured);
      expect(featured[0].distance).toBeLessThanOrEqual(featured[1].distance!);
    });

    it('should handle descending sort', () => {
      const result = filterAndSortTournaments(
        mockTournaments,
        'featured',
        'distance',
        'desc'
      );

      expect(result[0].distance).toBe(50);
      expect(result[1].distance).toBe(10);
    });
  });

  describe('getDatesBetween', () => {
    it('should return array of dates between start and end (inclusive)', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-03');

      const result = getDatesBetween(start, end);

      expect(result.length).toBe(3);
      expect(result[0].toISOString().split('T')[0]).toBe('2024-01-01');
      expect(result[1].toISOString().split('T')[0]).toBe('2024-01-02');
      expect(result[2].toISOString().split('T')[0]).toBe('2024-01-03');
    });

    it('should return single date when start equals end', () => {
      const date = new Date('2024-01-01');

      const result = getDatesBetween(date, date);

      expect(result.length).toBe(1);
    });

    it('should handle dates in reverse order', () => {
      const start = new Date('2024-01-03');
      const end = new Date('2024-01-01');

      const result = getDatesBetween(start, end);

      // Should still return 3 dates (uses Math.abs)
      expect(result.length).toBe(3);
    });

    it('should handle longer date ranges', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-10');

      const result = getDatesBetween(start, end);

      expect(result.length).toBe(10);
    });
  });

  describe('parseTournamentLocation', () => {
    it('should parse location with city, state, and country', () => {
      const result = parseTournamentLocation('Boston, MA, USA');

      expect(result.city).toBe('Boston');
      expect(result.state).toBe('MA');
      expect(result.country).toBe('USA');
    });

    it('should parse location with city and state only', () => {
      const result = parseTournamentLocation('Boston, MA');

      expect(result.city).toBe('Boston');
      expect(result.state).toBe('MA');
      expect(result.country).toBe('USA'); // Default
    });

    it('should parse location with city only', () => {
      const result = parseTournamentLocation('Boston');

      expect(result.city).toBe('Boston');
      expect(result.state).toBe('');
      expect(result.country).toBe('USA'); // Default
    });

    it('should handle empty string', () => {
      const result = parseTournamentLocation('');

      expect(result.city).toBe('');
      expect(result.state).toBe('');
      expect(result.country).toBe('USA');
    });

    it('should trim whitespace from parts', () => {
      const result = parseTournamentLocation('  Boston  ,  MA  ,  USA  ');

      expect(result.city).toBe('Boston');
      expect(result.state).toBe('MA');
      expect(result.country).toBe('USA');
    });

    it('should handle international locations', () => {
      const result = parseTournamentLocation('Toronto, ON, Canada');

      expect(result.city).toBe('Toronto');
      expect(result.state).toBe('ON');
      expect(result.country).toBe('Canada');
    });
  });

  describe('createTournamentGameInfo', () => {
    const mockTournamentData = {
      name: 'Spring Championship',
      location: 'Boston, MA, USA',
      rink: 'Boston Arena',
    };

    it('should create game info with all required fields', () => {
      const result = createTournamentGameInfo(
        mockTournamentData,
        'user-123',
        1,
        2
      );

      expect(result.rink).toBe('Boston Arena');
      expect(result.city).toBe('Boston');
      expect(result.state).toBe('MA');
      expect(result.country).toBe('USA');
      expect(result.time).toBe('12:00:00');
      expect(result.opponent).toBe(-1);
      expect(result.game_type).toBe('tournament');
      expect(result.isHome).toBe(false);
      expect(result.user).toBe('user-123');
      expect(result.team).toBe(1);
      expect(result.association).toBe(2);
      expect(result.tournamentName).toBe('Spring Championship');
    });

    it('should handle tournament without explicit country in location', () => {
      const tournament = {
        name: 'Local Tournament',
        location: 'Boston, MA',
        rink: 'Local Rink',
      };

      const result = createTournamentGameInfo(tournament, 'user-1', 1, 1);

      expect(result.country).toBe('USA');
    });

    it('should handle undefined team_id and association_id', () => {
      const result = createTournamentGameInfo(
        mockTournamentData,
        'user-123'
      );

      expect(result.team).toBeUndefined();
      expect(result.association).toBeUndefined();
    });
  });

  describe('registerForTournament', () => {
    const originalOpen = window.open;
    let windowOpenSpy: jest.Mock;

    beforeEach(() => {
      windowOpenSpy = jest.fn();
      window.open = windowOpenSpy;
    });

    afterEach(() => {
      window.open = originalOpen;
    });

    it('should open registration URL in new tab', () => {
      const tournament = {
        registrationUrl: 'https://example.com/register',
      };

      registerForTournament(tournament);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com/register',
        '_blank'
      );
    });

    it('should not open window if no registration URL', () => {
      const tournament = {};

      registerForTournament(tournament);

      expect(windowOpenSpy).not.toHaveBeenCalled();
    });

    it('should not open window if registration URL is empty', () => {
      const tournament = { registrationUrl: '' };

      registerForTournament(tournament);

      expect(windowOpenSpy).not.toHaveBeenCalled();
    });

    it('should handle null registration URL', () => {
      const tournament = { registrationUrl: null };

      registerForTournament(tournament);

      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });
});
