import { Test, TestingModule } from '@nestjs/testing';
import { CreateGameDto, Game, GamesQueryDto } from '../types';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

describe('GamesController', () => {
  let controller: GamesController;

  const mockGamesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockGame: Game = {
    id: '1',
    created_at: '2024-01-15T18:00:00Z',
    date: new Date('2024-01-15'),
    time: '18:00:00-05:00',
    gameType: 'Regular Season',
    city: 'Minneapolis',
    state: 'MN',
    rink: 'Ice Arena',
    opponent: 1234,
    user: 5678,
    isHome: true,
  };

  const mockCreateGameDto: CreateGameDto = {
    date: new Date('2024-01-15'),
    time: '18:00:00-05:00',
    gameType: 'Regular Season',
    city: 'Minneapolis',
    state: 'MN',
    rink: 'Ice Arena',
    opponent: 1234,
    user: 5678,
    isHome: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create multiple games', async () => {
      const gameDtos = [mockCreateGameDto];
      const expectedGames = [mockGame];
      mockGamesService.create.mockResolvedValue(expectedGames);

      const result = await controller.create(gameDtos);

      expect(mockGamesService.create).toHaveBeenCalledWith(gameDtos);
      expect(result).toEqual(expectedGames);
    });

    it('should handle service errors during creation', async () => {
      const gameDtos = [mockCreateGameDto];
      mockGamesService.create.mockRejectedValue(
        new Error('Could not create game'),
      );

      await expect(controller.create(gameDtos)).rejects.toThrow(
        'Could not create game',
      );
      expect(mockGamesService.create).toHaveBeenCalledWith(gameDtos);
    });
  });

  describe('findAll', () => {
    it('should return all games', async () => {
      const query: GamesQueryDto = { user: 5678 };
      const expectedGames = [mockGame];
      mockGamesService.findAll.mockResolvedValue(expectedGames);

      const result = await controller.findAll(query);

      expect(mockGamesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedGames);
    });

    it('should return games filtered by query parameters', async () => {
      const query: GamesQueryDto = { user: 5678 };
      const expectedGames = [mockGame];
      mockGamesService.findAll.mockResolvedValue(expectedGames);

      const result = await controller.findAll(query);

      expect(mockGamesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedGames);
    });

    it('should handle service errors when finding all', async () => {
      const query: GamesQueryDto = { user: 5678 };
      mockGamesService.findAll.mockRejectedValue(
        new Error('Could not fetch games'),
      );

      await expect(controller.findAll(query)).rejects.toThrow(
        'Could not fetch games',
      );
      expect(mockGamesService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single game by id', async () => {
      mockGamesService.findOne.mockResolvedValue(mockGame);

      const result = await controller.findOne('1');

      expect(mockGamesService.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockGame);
    });

    it('should return null when game not found', async () => {
      mockGamesService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(mockGamesService.findOne).toHaveBeenCalledWith('999');
      expect(result).toBeNull();
    });

    it('should handle service errors when finding one', async () => {
      mockGamesService.findOne.mockRejectedValue(
        new Error('Could not fetch game'),
      );

      await expect(controller.findOne('1')).rejects.toThrow(
        'Could not fetch game',
      );
      expect(mockGamesService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a game', async () => {
      const updateDto: Partial<CreateGameDto> = { gameType: 'Playoff' };
      const updatedGame = { ...mockGame, gameType: 'Playoff' };
      mockGamesService.update.mockResolvedValue(updatedGame);

      const result = await controller.update('1', updateDto);

      expect(mockGamesService.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(updatedGame);
    });

    it('should handle service errors during update', async () => {
      const updateDto: Partial<CreateGameDto> = { gameType: 'Playoff' };
      mockGamesService.update.mockRejectedValue(
        new Error('Could not update game'),
      );

      await expect(controller.update('1', updateDto)).rejects.toThrow(
        'Could not update game',
      );
      expect(mockGamesService.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should return null when game to update not found', async () => {
      const updateDto: Partial<CreateGameDto> = { gameType: 'Playoff' };
      mockGamesService.update.mockResolvedValue(null);

      const result = await controller.update('999', updateDto);

      expect(mockGamesService.update).toHaveBeenCalledWith('999', updateDto);
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a game', async () => {
      mockGamesService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(mockGamesService.remove).toHaveBeenCalledWith('1');
    });

    it('should handle service errors during removal', async () => {
      mockGamesService.remove.mockRejectedValue(
        new Error('Could not delete game'),
      );

      await expect(controller.remove('1')).rejects.toThrow(
        'Could not delete game',
      );
      expect(mockGamesService.remove).toHaveBeenCalledWith('1');
    });
  });
});
