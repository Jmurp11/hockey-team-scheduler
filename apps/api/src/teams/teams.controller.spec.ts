import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team } from '../types';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  const mockTeamsService = {
    getTeam: jest.fn(),
    getTeams: jest.fn(),
    getGirlsTeams: jest.fn(),
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
    service = module.get<TeamsService>(TeamsService);
    
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

      expect(service.getTeam).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTeam);
    });

    it('should return null when team not found', async () => {
      mockTeamsService.getTeam.mockResolvedValue(null);

      const result = await controller.getTeam(999);

      expect(service.getTeam).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      mockTeamsService.getTeam.mockRejectedValue(new Error('Service error'));

      await expect(controller.getTeam(1)).rejects.toThrow('Service error');
      expect(service.getTeam).toHaveBeenCalledWith(1);
    });

    it('should handle different ID types', async () => {
      mockTeamsService.getTeam.mockResolvedValue(mockTeam);

      await controller.getTeam(123);
      expect(service.getTeam).toHaveBeenCalledWith(123);

      await controller.getTeam(0);
      expect(service.getTeam).toHaveBeenCalledWith(0);
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
      mockTeamsService.getTeams.mockResolvedValue(mockTeams);

      const result = await controller.getTeams('12u');

      expect(service.getTeams).toHaveBeenCalledWith('12u');
      expect(result).toEqual(mockTeams);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no teams found', async () => {
      mockTeamsService.getTeams.mockResolvedValue([]);

      const result = await controller.getTeams('nonexistent');

      expect(service.getTeams).toHaveBeenCalledWith('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockTeamsService.getTeams.mockRejectedValue(new Error('Service error'));

      await expect(controller.getTeams('12u')).rejects.toThrow('Service error');
      expect(service.getTeams).toHaveBeenCalledWith('12u');
    });

    it('should handle different age formats', async () => {
      mockTeamsService.getTeams.mockResolvedValue(mockTeams);

      await controller.getTeams('12u');
      expect(service.getTeams).toHaveBeenCalledWith('12u');

      await controller.getTeams('14U');
      expect(service.getTeams).toHaveBeenCalledWith('14U');

      await controller.getTeams('16u');
      expect(service.getTeams).toHaveBeenCalledWith('16u');
    });

    it('should handle empty age parameter', async () => {
      mockTeamsService.getTeams.mockResolvedValue([]);

      const result = await controller.getTeams('');

      expect(service.getTeams).toHaveBeenCalledWith('');
      expect(result).toEqual([]);
    });
  });

  describe('getGirlsTeams', () => {
    const mockGirlsTeams: Team[] = [
      {
        id: '1',
        name: 'Girls Team 1',
        age: '14u',
        rating: 1300,
        record: '9-6-2',
        agd: 2.2,
        sched: 1050,
        association: {
          id: '1',
          name: 'Girls Association',
          city: 'Girls City',
          state: 'Girls State',
          country: 'Girls Country',
        },
      },
    ];

    it('should return girls teams by age group', async () => {
      mockTeamsService.getGirlsTeams.mockResolvedValue(mockGirlsTeams);

      const result = await controller.getGirlsTeams('14u');

      expect(service.getGirlsTeams).toHaveBeenCalledWith('14u');
      expect(result).toEqual(mockGirlsTeams);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no girls teams found', async () => {
      mockTeamsService.getGirlsTeams.mockResolvedValue([]);

      const result = await controller.getGirlsTeams('nonexistent');

      expect(service.getGirlsTeams).toHaveBeenCalledWith('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockTeamsService.getGirlsTeams.mockRejectedValue(new Error('Service error'));

      await expect(controller.getGirlsTeams('14u')).rejects.toThrow('Service error');
      expect(service.getGirlsTeams).toHaveBeenCalledWith('14u');
    });

    it('should handle different age formats for girls teams', async () => {
      mockTeamsService.getGirlsTeams.mockResolvedValue(mockGirlsTeams);

      await controller.getGirlsTeams('14u');
      expect(service.getGirlsTeams).toHaveBeenCalledWith('14u');

      await controller.getGirlsTeams('16U');
      expect(service.getGirlsTeams).toHaveBeenCalledWith('16U');

      await controller.getGirlsTeams('18u');
      expect(service.getGirlsTeams).toHaveBeenCalledWith('18u');
    });

    it('should handle empty age parameter for girls teams', async () => {
      mockTeamsService.getGirlsTeams.mockResolvedValue([]);

      const result = await controller.getGirlsTeams('');

      expect(service.getGirlsTeams).toHaveBeenCalledWith('');
      expect(result).toEqual([]);
    });
  });
});
