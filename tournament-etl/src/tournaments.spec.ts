// Mock supabase before importing
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
  getTournaments: jest.fn(),
  insertTournaments: jest.fn(),
}));

jest.mock('./open-ai');

import * as openAI from './open-ai';
import * as supabase from './supabase';
import { runETL } from './tournaments';
import { TournamentProps } from './types';

describe('tournaments', () => {
  describe('runETL', () => {
    const mockProps: TournamentProps = {
      location: 'New York',
      locationType: 'state',
    };

    const mockTournaments = [
      {
        name: 'Test Tournament 1',
        location: 'Buffalo, NY',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        registrationUrl: 'https://example.com/tournament1',
        description: 'Test tournament 1',
        rink: 'Test Rink 1',
        age: ['10U', '12U'],
        level: ['AAA', 'AA'],
        latitude: 42.8864,
        longitude: -78.8784,
      },
      {
        name: 'Test Tournament 2',
        location: 'Rochester, NY',
        startDate: '2025-12-10',
        endDate: '2025-12-12',
        registrationUrl: 'https://example.com/tournament2',
        description: 'Test tournament 2',
        rink: 'Test Rink 2',
        age: ['14U', '16U'],
        level: ['A'],
        latitude: 43.1566,
        longitude: -77.6088,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully run ETL process with new tournaments', async () => {
      // Arrange
      const mockFoundTournaments = {
        data: [
          {
            registration_link: 'https://example.com/existing',
          },
        ],
      };

      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockResolvedValue(mockFoundTournaments);
      (supabase.insertTournaments as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await runETL(mockProps);

      // Assert
      expect(openAI.findTournaments).toHaveBeenCalledWith(mockProps);
      expect(supabase.getTournaments).toHaveBeenCalled();
      expect(supabase.insertTournaments).toHaveBeenCalled();
    });

    it('should filter out existing tournaments before insertion', async () => {
      // Arrange
      const mockFoundTournaments = {
        data: [
          {
            registration_link: 'https://example.com/tournament1',
          },
        ],
      };

      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockResolvedValue(mockFoundTournaments);
      (supabase.insertTournaments as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await runETL(mockProps);

      // Assert
      const insertCall = (supabase.insertTournaments as jest.Mock).mock.calls[0][0];
      expect(insertCall.length).toBe(1);
      expect(insertCall[0].registrationUrl).toBe('https://example.com/tournament2');
    });

    it('should insert all tournaments when none exist', async () => {
      // Arrange
      const mockFoundTournaments = {
        data: [],
      };

      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockResolvedValue(mockFoundTournaments);
      (supabase.insertTournaments as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await runETL(mockProps);

      // Assert
      const insertCall = (supabase.insertTournaments as jest.Mock).mock.calls[0][0];
      expect(insertCall.length).toBe(2);
    });

    it('should handle when getTournaments returns null data', async () => {
      // Arrange
      const mockFoundTournaments = {
        data: null,
      };

      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockResolvedValue(mockFoundTournaments);
      (supabase.insertTournaments as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await runETL(mockProps);

      // Assert
      const insertCall = (supabase.insertTournaments as jest.Mock).mock.calls[0][0];
      expect(insertCall.length).toBe(2);
    });

    it('should throw error when findTournaments fails', async () => {
      // Arrange
      const mockError = new Error('OpenAI API error');
      (openAI.findTournaments as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      try {
        await runETL(mockProps);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('ETL process failed: OpenAI API error');
      }
    });

    it('should throw error when getTournaments fails', async () => {
      // Arrange
      const mockError = new Error('Database error');
      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      try {
        await runETL(mockProps);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('ETL process failed: Database error');
      }
    });

    it('should throw error when insertTournaments fails', async () => {
      // Arrange
      const mockError = new Error('Insert error');
      const mockFoundTournaments = { data: [] };

      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockResolvedValue(mockFoundTournaments);
      (supabase.insertTournaments as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      try {
        await runETL(mockProps);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('ETL process failed: Insert error');
      }
    });

    it('should not insert tournaments when all are duplicates', async () => {
      // Arrange
      const mockFoundTournaments = {
        data: [
          { registration_link: 'https://example.com/tournament1' },
          { registration_link: 'https://example.com/tournament2' },
        ],
      };

      (openAI.findTournaments as jest.Mock).mockResolvedValue(mockTournaments);
      (supabase.getTournaments as jest.Mock).mockResolvedValue(mockFoundTournaments);
      (supabase.insertTournaments as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await runETL(mockProps);

      // Assert
      const insertCall = (supabase.insertTournaments as jest.Mock).mock.calls[0][0];
      expect(insertCall.length).toBe(0);
    });
  });
});
