import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesService } from './leagues.service';
import { League } from '../types';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn()
  },
}));

import { supabase } from '../supabase';

describe('LeaguesService', () => {
  let service: LeaguesService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeaguesService],
    }).compile();

    service = module.get<LeaguesService>(LeaguesService);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeague', () => {
    const mockLeagueData = {
      id: '1',
      name: 'Test League',
      abbreviation: 'TL',
      location: 'Test Location',
      associations: ['{"id": "1", "name": "Test Association"}'],
    };

    it('should return a league when found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockLeagueData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        single: mockSingle,
      });

      const result = await service.getLeague('TL');

      expect(mockSupabase.from).toHaveBeenCalledWith('leagueswithjoin');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIlike).toHaveBeenCalledWith('league_abbreviation', 'TL');
      expect(result).toBeDefined();
    });

    it('should return null when no league is found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        single: mockSingle,
      });

      const result = await service.getLeague('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        single: mockSingle,
      });

      await expect(service.getLeague('TL')).rejects.toThrow('Failed to fetch league data');
    });
  });

  describe('getLeagues', () => {
    const mockLeaguesData = [
      {
        id: '1',
        name: 'League 1',
        abbreviation: 'L1',
        location: 'Location 1',
      },
      {
        id: '2',
        name: 'League 2',
        abbreviation: 'L2',
        location: 'Location 2',
      },
    ];

    it('should return all leagues', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockLeaguesData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await service.getLeagues();

      expect(mockSupabase.from).toHaveBeenCalledWith('leagues');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockLeaguesData);
    });

    it('should return empty array when no leagues found', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await service.getLeagues();

      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(service.getLeagues()).rejects.toThrow('Failed to fetch leagues data');
    });

    it('should handle null data gracefully', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await service.getLeagues();

      expect(result).toEqual([]);
    });
  });
});
