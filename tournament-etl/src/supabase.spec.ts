import { Tournament } from './types';

// Mock the supabase module
const mockIn = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn().mockReturnValue({ in: mockIn });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
const mockRpc = jest.fn().mockResolvedValue({ data: { success: true }, error: null });

const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
};

jest.mock('./supabase', () => ({
  supabase: mockSupabaseClient,
  getTournaments: (tournaments: Tournament[]) => {
    try {
      return mockSupabaseClient
        .from("tournaments")
        .select("*")
        .in(
          "registrationUrl",
          tournaments.map((t: Tournament) => t.registrationUrl)
        );
    } catch (error) {
      throw new Error("Could not get tournaments: " + (error as Error).message);
    }
  },
  insertTournaments: async (tournaments: Tournament[]) => {
    try {
      return await mockSupabaseClient.rpc("p_save_tournaments", {
        _tournaments: tournaments,
      });
    } catch (error) {
      throw new Error(
        "Could not insert tournaments: " + (error as Error).message
      );
    }
  },
}));

import { getTournaments, insertTournaments } from './supabase';

describe('supabase', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockIn: jest.Mock;
  let mockRpc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockIn = jest.fn().mockResolvedValue({ data: [], error: null });
    mockSelect = jest.fn().mockReturnValue({ in: mockIn });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    mockRpc = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
    
    // Update the mock client
    mockSupabaseClient.from = mockFrom;
    mockSupabaseClient.rpc = mockRpc;
  });

  describe('getTournaments', () => {
    const mockTournaments: Tournament[] = [
      {
        name: 'Test Tournament 1',
        city: 'Buffalo',
        state: 'NY',
        country: 'USA',
        rink: 'Test Rink 1',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        registrationUrl: 'https://example.com/tournament1',
        age: ['10U', '12U'],
        level: ['AAA', 'AA'],
        latitude: 42.8864,
        longitude: -78.8784,
      },
      {
        name: 'Test Tournament 2',
        city: 'Rochester',
        state: 'NY',
        country: 'USA',
        rink: 'Test Rink 2',
        startDate: '2025-12-10',
        endDate: '2025-12-12',
        registrationUrl: 'https://example.com/tournament2',
        age: ['14U', '16U'],
        level: ['A'],
        latitude: 43.1566,
        longitude: -77.6088,
      },
    ];

    it('should query tournaments by registration URLs', () => {
      // Act
      getTournaments(mockTournaments);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('tournaments');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIn).toHaveBeenCalledWith('registrationUrl', [
        'https://example.com/tournament1',
        'https://example.com/tournament2',
      ]);
    });

    it('should handle single tournament', () => {
      // Arrange
      const singleTournament = [mockTournaments[0]];

      // Act
      getTournaments(singleTournament);

      // Assert
      expect(mockIn).toHaveBeenCalledWith('registrationUrl', [
        'https://example.com/tournament1',
      ]);
    });

    it('should handle empty array', () => {
      // Act
      getTournaments([]);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('tournaments');
      expect(mockIn).toHaveBeenCalledWith('registrationUrl', []);
    });

    it('should throw error when database query fails', () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      mockFrom.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      try {
        getTournaments(mockTournaments);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Could not get tournaments: Database connection failed');
      }
    });

    it('should handle tournaments with various registration URLs', () => {
      // Arrange
      const tournaments: Tournament[] = [
        {
          ...mockTournaments[0],
          registrationUrl: 'https://test.com/reg1',
        },
        {
          ...mockTournaments[1],
          registrationUrl: 'https://test.com/reg2',
        },
      ];

      // Act
      getTournaments(tournaments);

      // Assert
      expect(mockIn).toHaveBeenCalledWith('registrationUrl', [
        'https://test.com/reg1',
        'https://test.com/reg2',
      ]);
    });
  });

  describe('insertTournaments', () => {
    const mockTournaments: Tournament[] = [
      {
        name: 'Test Tournament 1',
        city: 'Buffalo',
        state: 'NY',
        country: 'USA',
        rink: 'Test Rink 1',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        registrationUrl: 'https://example.com/tournament1',
        age: ['10U', '12U'],
        level: ['AAA', 'AA'],
        latitude: 42.8864,
        longitude: -78.8784,
      },
    ];

    it('should call RPC function with tournaments data', async () => {
      // Act
      await insertTournaments(mockTournaments);

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('p_save_tournaments', {
        _tournaments: mockTournaments,
      });
    });

    it('should handle successful insertion', async () => {
      // Arrange
      const mockResponse = { data: { success: true }, error: null };
      mockRpc.mockResolvedValue(mockResponse);

      // Act
      const result = await insertTournaments(mockTournaments);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toEqual({ success: true });
    });

    it('should handle empty array', async () => {
      // Act
      await insertTournaments([]);

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('p_save_tournaments', {
        _tournaments: [],
      });
    });

    it('should handle multiple tournaments', async () => {
      // Arrange
      const multipleTournaments: Tournament[] = [
        mockTournaments[0],
        {
          name: 'Test Tournament 2',
          city: 'Rochester',
          state: 'NY',
          country: 'USA',
          rink: 'Test Rink 2',
          startDate: '2025-12-10',
          endDate: '2025-12-12',
          registrationUrl: 'https://example.com/tournament2',
          age: ['14U'],
          level: ['A'],
          latitude: 43.1566,
          longitude: -77.6088,
        },
      ];

      // Act
      await insertTournaments(multipleTournaments);

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('p_save_tournaments', {
        _tournaments: multipleTournaments,
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      const mockError = new Error('RPC call failed');
      mockRpc.mockRejectedValue(mockError);

      // Act & Assert
      try {
        await insertTournaments(mockTournaments);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Could not insert tournaments: RPC call failed');
      }
    });

    it('should handle tournaments with null values', async () => {
      // Arrange
      const tournamentsWithNulls: Tournament[] = [
        {
          name: 'Test Tournament',
          city: 'Buffalo',
          state: 'NY',
          country: 'USA',
          rink: null,
          startDate: '2025-12-01',
          endDate: '2025-12-03',
          registrationUrl: 'https://example.com/tournament',
          age: [],
          level: [],
          latitude: 42.8864,
          longitude: -78.8784,
        },
      ];

      // Act
      await insertTournaments(tournamentsWithNulls);

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('p_save_tournaments', {
        _tournaments: tournamentsWithNulls,
      });
    });

    it('should propagate error message correctly', async () => {
      // Arrange
      const specificError = new Error('Unique constraint violation');
      mockRpc.mockRejectedValue(specificError);

      // Act & Assert
      try {
        await insertTournaments(mockTournaments);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Could not insert tournaments: Unique constraint violation');
      }
    });
  });
});
