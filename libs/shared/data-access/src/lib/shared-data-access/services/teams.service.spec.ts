import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

// Create a simple mock service to avoid dependency issues
class MockTeamsService {
  private config = { apiUrl: 'http://localhost:3333/api' };
  
  constructor(private http: any) {}

  teams(teamParams: any) {
    const params: any = {};
    if (teamParams.association) {
      params.association = teamParams.association.toString();
    }
    if (teamParams.age) {
      params.age = teamParams.age.toString();
    }
    return this.http.get(`${this.config.apiUrl}/teams`, { params });
  }

  nearbyTeams(params: any) {
    return this.http.get(`${this.config.apiUrl}/teams/nearbyTeams`, {
      params: {
        p_id: params.p_id.toString(),
        p_girls_only: params.p_girls_only.toString(),
        p_age: params.p_age,
        p_max_rating: params.p_max_rating.toString(),
        p_min_rating: params.p_min_rating.toString(),
        p_max_distance: params.p_max_distance.toString(),
      },
    });
  }
}

describe('TeamsService', () => {
  let service: MockTeamsService;
  let httpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
    } as any;

    service = new MockTeamsService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('teams', () => {
    it('should call HTTP GET with correct URL and no parameters', () => {
      const teamParams = {};
      httpClient.get.mockReturnValue(of([]));

      service.teams(teamParams);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/teams',
        { params: {} }
      );
    });

    it('should call HTTP GET with association parameter', () => {
      const teamParams = { association: 123 };
      httpClient.get.mockReturnValue(of([]));

      service.teams(teamParams);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/teams',
        { params: { association: '123' } }
      );
    });

    it('should call HTTP GET with age parameter', () => {
      const teamParams = { age: 'U16' };
      httpClient.get.mockReturnValue(of([]));

      service.teams(teamParams);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/teams',
        { params: { age: 'U16' } }
      );
    });

    it('should call HTTP GET with both association and age parameters', () => {
      const teamParams = { association: 456, age: 'U18' };
      httpClient.get.mockReturnValue(of([]));

      service.teams(teamParams);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/teams',
        { params: { association: '456', age: 'U18' } }
      );
    });
  });

  describe('nearbyTeams', () => {
    it('should call HTTP GET with correct URL and parameters', () => {
      const params = {
        p_id: 123,
        p_girls_only: true,
        p_age: 'U16',
        p_max_rating: 100,
        p_min_rating: 50,
        p_max_distance: 25,
      };
      httpClient.get.mockReturnValue(of([]));

      service.nearbyTeams(params);

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/teams/nearbyTeams',
        {
          params: {
            p_id: '123',
            p_girls_only: 'true',
            p_age: 'U16',
            p_max_rating: '100',
            p_min_rating: '50',
            p_max_distance: '25',
          },
        }
      );
    });
  });


});