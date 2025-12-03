import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';

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
      expect(result?.association.city).toBe('Test City');
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

      await expect(service.getTeam(1)).rejects.toThrow(
        'Failed to fetch team data',
      );
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

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('Test Team');
      expect(result?.age).toBe('12u');
      expect(result?.rating).toBe(1500);
      expect(result?.record).toBe('10-5-2');
      expect(result?.agd).toBe(2.5);
      expect(result?.sched).toBe(1200);
      expect(result?.association.name).toBe('Test Association');
      expect(result?.association.city).toBe('Test City');
      expect(result?.association.state).toBe('Test State');
      expect(result?.association.country).toBe('Test Country');
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
      const mockQuery = {
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      // Create a thenable object that resolves to the data
      Object.assign(mockQuery, {
        then(onfulfilled: any) {
          return Promise.resolve({
            data: mockTeamsData,
            error: null,
          }).then(onfulfilled);
        },
      });

      const mockSelect = jest.fn().mockReturnValue(mockQuery);

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      // Set ilike to return the same mockQuery
      mockQuery.ilike.mockReturnValue(mockQuery);

      const result = await service.getTeams({ age: '12u' });

      expect(mockSupabase.from).toHaveBeenCalledWith('rankingswithassoc');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockQuery.ilike).toHaveBeenCalledWith('age', '%12u%');
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

      const result = await service.getTeams({ age: 'nonexistent' });

      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const mockQuery = {
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      // Create a thenable object that resolves to an error
      Object.assign(mockQuery, {
        then(onfulfilled: any) {
          return Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          }).then(onfulfilled);
        },
      });

      const mockSelect = jest.fn().mockReturnValue(mockQuery);

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      // Set ilike to return the same mockQuery
      mockQuery.ilike.mockReturnValue(mockQuery);

      await expect(service.getTeams({ age: '12u' })).rejects.toThrow(
        'Failed to fetch teams data',
      );
    });

    it('should transform all teams correctly', async () => {
      const mockQuery = {
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      // Create a thenable object that resolves to the data
      Object.assign(mockQuery, {
        then(onfulfilled: any) {
          return Promise.resolve({
            data: mockTeamsData,
            error: null,
          }).then(onfulfilled);
        },
      });

      const mockSelect = jest.fn().mockReturnValue(mockQuery);

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      // Set ilike to return the same mockQuery
      mockQuery.ilike.mockReturnValue(mockQuery);

      const result = await service.getTeams({ age: '12u' });

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Team 1');
      expect(result[0].age).toBe('12u');
      expect(result[0].rating).toBe(1500);
      expect(result[0].record).toBe('10-5-2');
      expect(result[0].agd).toBe(2.5);
      expect(result[0].sched).toBe(1200);
      expect(result[0].association.name).toBe('Association 1');
      expect(result[0].association.city).toBe('City 1');
      expect(result[0].association.state).toBe('State 1');
      expect(result[0].association.country).toBe('Country 1');
    });
  });
});
