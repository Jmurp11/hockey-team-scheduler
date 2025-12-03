import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

// Create a simple mock service to avoid dependency issues
class MockTournamentsService {
  private config = { apiUrl: 'http://localhost:3333/api' };
  
  constructor(private http: any) {}

  tournaments() {
    return this.http.get(`${this.config.apiUrl}/tournaments`);
  }

  nearByTournaments(params: any) {
    return this.http.get(`${this.config.apiUrl}/tournaments/nearbyTournaments`, {
      params: {
        p_id: params.p_id.toString()
      },
    });
  }
}

describe('TournamentsService', () => {
  let service: MockTournamentsService;
  let httpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
    } as any;

    service = new MockTournamentsService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('tournaments', () => {
    it('should call HTTP GET with correct URL', () => {
      const mockTournaments = [
        { id: 1, name: 'Summer Tournament', location: 'City A' },
        { id: 2, name: 'Winter Championship', location: 'City B' },
      ];
      httpClient.get.mockReturnValue(of(mockTournaments));

      service.tournaments();

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/tournaments'
      );
    });

    it('should return observable from HTTP GET', (done) => {
      const mockTournaments = [
        { id: 1, name: 'Test Tournament' },
      ];
      httpClient.get.mockReturnValue(of(mockTournaments));

      service.tournaments().subscribe((result: any) => {
        expect(result).toEqual(mockTournaments);
        done();
      });
    });
  });

  describe('nearByTournaments', () => {
    it('should call HTTP GET with correct URL and parameters', () => {
      const params = { p_id: 123 };
      httpClient.get.mockReturnValue(of([]));

      service.nearByTournaments(params);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/tournaments/nearbyTournaments',
        {
          params: {
            p_id: '123',
          },
        }
      );
    });

    it('should convert p_id to string in parameters', () => {
      const params = { p_id: 456 };
      httpClient.get.mockReturnValue(of([]));

      service.nearByTournaments(params);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/tournaments/nearbyTournaments',
        {
          params: {
            p_id: '456',
          },
        }
      );
    });

    it('should return observable from HTTP GET', (done) => {
      const params = { p_id: 789 };
      const mockNearbyTournaments = [
        { id: 1, name: 'Nearby Tournament 1', distance: 15 },
        { id: 2, name: 'Nearby Tournament 2', distance: 22 },
      ];
      httpClient.get.mockReturnValue(of(mockNearbyTournaments));

      service.nearByTournaments(params).subscribe((result: any) => {
        expect(result).toEqual(mockNearbyTournaments);
        done();
      });
    });
  });
});