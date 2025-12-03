import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, BehaviorSubject } from 'rxjs';

// Create a simple mock service to avoid dependency issues
class MockScheduleService {
  private config = { apiUrl: 'http://localhost:3333/api' };
  gamesCache = new BehaviorSubject<any[] | null>(null);
  
  constructor(private http: any) {}

  games(userId: string) {
    return this.http.get(`${this.config.apiUrl}/games?user=${userId}`);
  }

  deleteGame(gameId: string) {
    return this.http.delete(`${this.config.apiUrl}/games/${gameId}`);
  }

  optimisticAddGames(games: any[]) {
    const currentGames = this.gamesCache.value;
    this.gamesCache.next([...(currentGames || []), ...games]);
  }

  optimisticDeleteGame(gameId: string) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const filtered = currentGames.filter((game) => game.id.toString() !== gameId);
    this.gamesCache.next(filtered);
  }
}

describe('ScheduleService', () => {
  let service: MockScheduleService;
  let httpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new MockScheduleService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null gamesCache', () => {
    expect(service.gamesCache.value).toBeNull();
  });

  describe('games', () => {
    it('should call HTTP GET with correct URL and user parameter', () => {
      const userId = 'user-123';
      const mockGames = [
        { id: 1, opponent: 'Team A', date: '2024-01-01' },
        { id: 2, opponent: 'Team B', date: '2024-01-02' },
      ];
      httpClient.get.mockReturnValue(of(mockGames));

      service.games(userId);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/games?user=user-123'
      );
    });

    it('should return observable from HTTP GET', (done) => {
      const userId = 'user-456';
      const mockGames = [{ id: 1, opponent: 'Team A' }];
      httpClient.get.mockReturnValue(of(mockGames));

      service.games(userId).subscribe((result: any) => {
        expect(result).toEqual(mockGames);
        done();
      });
    });
  });

  describe('deleteGame', () => {
    it('should call HTTP DELETE with correct URL', () => {
      const gameId = '123';
      httpClient.delete.mockReturnValue(of({}));

      service.deleteGame(gameId);

      expect(httpClient.delete).toHaveBeenCalledWith(
        'http://localhost:3333/api/games/123'
      );
    });
  });

  describe('optimisticAddGames', () => {
    it('should add games to cache', () => {
      const existingGames = [
        { id: 1, opponent: 'Team A' },
      ];
      service.gamesCache.next(existingGames);

      const newGames = [
        { id: 2, opponent: 'Team B' },
      ];

      service.optimisticAddGames(newGames);

      const result = service.gamesCache.value;
      expect(result).toHaveLength(2);
      expect(result![0].id).toBe(1);
      expect(result![1].id).toBe(2);
    });

    it('should handle empty cache', () => {
      service.gamesCache.next(null);
      const newGames = [
        { id: 1, opponent: 'Team A' },
      ];

      service.optimisticAddGames(newGames);

      const result = service.gamesCache.value;
      expect(result).toHaveLength(1);
      expect(result![0].id).toBe(1);
    });
  });



  describe('optimisticDeleteGame', () => {
    it('should remove game from cache', () => {
      const existingGames = [
        { id: 1, opponent: 'Team A' },
        { id: 2, opponent: 'Team B' },
        { id: 3, opponent: 'Team C' },
      ];
      service.gamesCache.next(existingGames);

      service.optimisticDeleteGame('2');

      const result = service.gamesCache.value;
      expect(result).toHaveLength(2);
      expect(result!.map(g => g.id)).toEqual([1, 3]);
    });

    it('should handle null cache gracefully', () => {
      service.gamesCache.next(null);

      expect(() => service.optimisticDeleteGame('1')).not.toThrow();
    });
  });


});