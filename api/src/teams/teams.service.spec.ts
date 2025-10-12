import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { Team } from '../types';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../supabase';

describe('TeamsService', () => {
  let service: TeamsService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamsService],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTeam', () => {
    const mockTeamData = {
      id: 1,
      team_name: 'Test Team',
      age: '12u',
      rating: 1500,
      record: '10-5-2',
      agd: 2.5,
      sched: 1200,
      name: 'Test Association',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
    };

    it('should return a team when found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockTeamData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await service.getTeam(1);

      expect(mockSupabase.from).toHaveBeenCalledWith('rankingswithassoc');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('Test Team');
      expect(result?.association.name).toBe('Test Association');
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(service.getTeam(1)).rejects.toThrow('Failed to fetch team data');
    });

    it('should transform database fields to expected format', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockTeamData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await service.getTeam(1);

      expect(result).toEqual({
        id: 1,
        name: 'Test Team',
        age: '12u',
        rating: 1500,
        record: '10-5-2',
        agd: 2.5,
        sched: 1200,
        association: {
          name: 'Test Association',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
        },
      });
    });
  });

  describe('getTeams', () => {
    const mockTeamsData = [
      {
        id: 1,
        team_name: 'Team 1',
        age: '12u',
        rating: 1500,
        record: '10-5-2',
        agd: 2.5,
        sched: 1200,
        name: 'Association 1',
        city: 'City 1',
        state: 'State 1',
        country: 'Country 1',
      },
      {
        id: 2,
        team_name: 'Team 2',
        age: '12u',
        rating: 1400,
        record: '8-7-2',
        agd: 1.8,
        sched: 1100,
        name: 'Association 2',
        city: 'City 2',
        state: 'State 2',
        country: 'Country 2',
      },
    ];

    it('should return teams filtered by age', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockTeamsData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getTeams('12u');

      expect(mockSupabase.from).toHaveBeenCalledWith('rankingswithassoc');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIlike).toHaveBeenCalledWith('age', '12u');
      expect(mockEq).toHaveBeenCalledWith('girls_only', false);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no teams found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getTeams('nonexistent');

      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      await expect(service.getTeams('12u')).rejects.toThrow('Failed to fetch teams data');
    });

    it('should transform all teams correctly', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockTeamsData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getTeams('12u');

      expect(result[0]).toEqual({
        id: 1,
        team: 'Team 1',
        age: '12u',
        rating: 1500,
        record: '10-5-2',
        agd: 2.5,
        sched: 1200,
        association: {
          name: 'Association 1',
          city: 'City 1',
          state: 'State 1',
          country: 'Country 1',
        },
      });
    });
  });

  describe('getGirlsTeams', () => {
    const mockGirlsTeamsData = [
      {
        id: 1,
        team_name: 'Girls Team 1',
        age: '14u',
        rating: 1300,
        record: '9-6-2',
        agd: 2.2,
        sched: 1050,
        name: 'Girls Association',
        city: 'Girls City',
        state: 'Girls State',
        country: 'Girls Country',
      },
    ];

    it('should return girls teams filtered by age', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockGirlsTeamsData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getGirlsTeams('14u');

      expect(mockSupabase.from).toHaveBeenCalledWith('rankingswithassoc');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIlike).toHaveBeenCalledWith('age', '14u');
      expect(mockEq).toHaveBeenCalledWith('girls_only', true);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no girls teams found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getGirlsTeams('nonexistent');

      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        eq: mockEq,
      });

      await expect(service.getGirlsTeams('14u')).rejects.toThrow('Failed to fetch teams data');
    });
  });
});
