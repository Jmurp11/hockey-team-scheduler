import { Test, TestingModule } from '@nestjs/testing';
import { Team, TeamsQueryDto } from '../types';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;

  const mockTeamsService = {
    getTeam: jest.fn(),
    getTeams: jest.fn(),
    getNearbyTeams: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTeam', () => {
    const mockTeam: Team = {
      id: '1',
      name: 'Test Team',
      age: '12u',
      rating: 1500,
      record: '10-5-2',
      agd: 2.5,
      sched: 1200,
      association: {
        id: '1',
        name: 'Test Association',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
      },
    };

    it('should return a team when found', async () => {
      mockTeamsService.getTeam.mockResolvedValue(mockTeam);

      const result = await controller.getTeam(1);

      expect(mockTeamsService.getTeam).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTeam);
    });

    it('should return null when team not found', async () => {
      mockTeamsService.getTeam.mockResolvedValue(null);

      const result = await controller.getTeam(999);

      expect(mockTeamsService.getTeam).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      mockTeamsService.getTeam.mockRejectedValue(new Error('Service error'));

      await expect(controller.getTeam(1)).rejects.toThrow('Service error');
      expect(mockTeamsService.getTeam).toHaveBeenCalledWith(1);
    });

    it('should handle different ID types', async () => {
      mockTeamsService.getTeam.mockResolvedValue(mockTeam);

      await controller.getTeam(123);
      expect(mockTeamsService.getTeam).toHaveBeenCalledWith(123);

      await controller.getTeam(0);
      expect(mockTeamsService.getTeam).toHaveBeenCalledWith(0);
    });
  });

  describe('getTeams', () => {
    const mockTeams: Team[] = [
      {
        id: '1',
        name: 'Team 1',
        age: '12u',
        rating: 1500,
        record: '10-5-2',
        agd: 2.5,
        sched: 1200,
        association: {
          id: '1',
          name: 'Association 1',
          city: 'City 1',
          state: 'State 1',
          country: 'Country 1',
        },
      },
      {
        id: '2',
        name: 'Team 2',
        age: '12u',
        rating: 1400,
        record: '8-7-2',
        agd: 1.8,
        sched: 1100,
        association: {
          id: '2',
          name: 'Association 2',
          city: 'City 2',
          state: 'State 2',
          country: 'Country 2',
        },
      },
    ];

    it('should return teams by age group', async () => {
      const query = { age: '12u' } as TeamsQueryDto;
      mockTeamsService.getTeams.mockResolvedValue(mockTeams);

      const result = await controller.getTeams(query);

      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockTeams);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no teams found', async () => {
      const query = { age: 'nonexistent' } as TeamsQueryDto;
      mockTeamsService.getTeams.mockResolvedValue([]);

      const result = await controller.getTeams(query);

      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const query = { age: '12u' } as TeamsQueryDto;
      mockTeamsService.getTeams.mockRejectedValue(new Error('Service error'));

      await expect(controller.getTeams(query)).rejects.toThrow('Service error');
      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query);
    });

    it('should handle different query parameters', async () => {
      mockTeamsService.getTeams.mockResolvedValue(mockTeams);

      const query1 = { age: '12u' } as TeamsQueryDto;
      await controller.getTeams(query1);
      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query1);

      const query2 = { association: 5 } as TeamsQueryDto;
      await controller.getTeams(query2);
      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query2);

      const query3 = { girls_only: true } as TeamsQueryDto;
      await controller.getTeams(query3);
      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query3);
    });

    it('should handle empty query', async () => {
      const query = {} as TeamsQueryDto;
      mockTeamsService.getTeams.mockResolvedValue([]);

      const result = await controller.getTeams(query);

      expect(mockTeamsService.getTeams).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });
  });
});
