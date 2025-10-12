import { Test, TestingModule } from '@nestjs/testing';
import { LeagueController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { League } from '../types';

describe('LeagueController', () => {
  let controller: LeagueController;
  let service: LeaguesService;

  const mockLeaguesService = {
    getLeague: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeagueController],
      providers: [
        {
          provide: LeaguesService,
          useValue: mockLeaguesService,
        },
      ],
    }).compile();

    controller = module.get<LeagueController>(LeagueController);
    service = module.get<LeaguesService>(LeaguesService);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLeague', () => {
    const mockLeague: League = {
      id: '1',
      name: 'Test League',
      abbreviation: 'TL',
      location: 'Test Location',
      associations: [
        {
          id: '1',
          name: 'Test Association',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
        },
      ],
    };

    it('should return a league when found', async () => {
      mockLeaguesService.getLeague.mockResolvedValue([mockLeague]);

      const result = await controller.getLeague('TL');

      expect(service.getLeague).toHaveBeenCalledWith('TL');
      expect(result).toEqual([mockLeague]);
    });

    it('should return empty array when no league found', async () => {
      mockLeaguesService.getLeague.mockResolvedValue([]);

      const result = await controller.getLeague('NONEXISTENT');

      expect(service.getLeague).toHaveBeenCalledWith('NONEXISTENT');
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockLeaguesService.getLeague.mockRejectedValue(new Error('Service error'));

      await expect(controller.getLeague('TL')).rejects.toThrow('Service error');
      expect(service.getLeague).toHaveBeenCalledWith('TL');
    });

    it('should handle different abbreviation formats', async () => {
      mockLeaguesService.getLeague.mockResolvedValue([mockLeague]);

      await controller.getLeague('nhl');
      expect(service.getLeague).toHaveBeenCalledWith('nhl');

      await controller.getLeague('NHL');
      expect(service.getLeague).toHaveBeenCalledWith('NHL');

      await controller.getLeague('Nhl');
      expect(service.getLeague).toHaveBeenCalledWith('Nhl');
    });
  });
});
