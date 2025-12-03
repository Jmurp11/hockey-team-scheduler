import { Test, TestingModule } from '@nestjs/testing';
import { Tournament, TournamentProps } from '../types';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

describe('TournamentsController', () => {
  let controller: TournamentsController;

  const mockTournamentsService = {
    getTournaments: jest.fn(),
    getTournament: jest.fn(),
    getNearbyTournaments: jest.fn(),
  };

  const mockTournament: Tournament = {
    id: '1',
    name: 'Winter Classic Tournament',
    location: 'Boston, MA',
    startDate: '2024-02-01',
    endDate: '2024-02-03',
    registrationUrl: 'https://example.com/register',
    description: 'Annual winter tournament',
    rink: 'Boston Ice Arena',
    age: ['10u', '12u', '14u'],
    level: ['AA', 'AAA'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentsController],
      providers: [
        {
          provide: TournamentsService,
          useValue: mockTournamentsService,
        },
      ],
    }).compile();

    controller = module.get<TournamentsController>(TournamentsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTournaments', () => {
    it('should return all tournaments', async () => {
      const mockTournaments = [mockTournament];
      mockTournamentsService.getTournaments.mockResolvedValue(mockTournaments);

      const result = await controller.getTournaments();

      expect(mockTournamentsService.getTournaments).toHaveBeenCalled();
      expect(result).toEqual(mockTournaments);
    });

    it('should handle errors when fetching tournaments', async () => {
      mockTournamentsService.getTournaments.mockRejectedValue(
        new Error('Failed to fetch tournaments'),
      );

      await expect(controller.getTournaments()).rejects.toThrow(
        'Failed to fetch tournaments',
      );
    });
  });

  describe('getNearbyTeams', () => {
    it('should return nearby tournaments', async () => {
      const queryParams: TournamentProps = {
        p_id: 123,
      };
      const mockNearbyTournaments = [mockTournament];
      mockTournamentsService.getNearbyTournaments.mockResolvedValue(
        mockNearbyTournaments,
      );

      const result = await controller.getNearbyTeams(queryParams);

      expect(mockTournamentsService.getNearbyTournaments).toHaveBeenCalledWith(
        queryParams,
      );
      expect(result).toEqual(mockNearbyTournaments);
    });

    it('should handle empty results', async () => {
      const queryParams: TournamentProps = {
        p_id: 999,
      };
      mockTournamentsService.getNearbyTournaments.mockResolvedValue([]);

      const result = await controller.getNearbyTeams(queryParams);

      expect(mockTournamentsService.getNearbyTournaments).toHaveBeenCalledWith(
        queryParams,
      );
      expect(result).toEqual([]);
    });

    it('should handle errors when fetching nearby tournaments', async () => {
      const queryParams: TournamentProps = {
        p_id: 123,
      };
      mockTournamentsService.getNearbyTournaments.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getNearbyTeams(queryParams)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
