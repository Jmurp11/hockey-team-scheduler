import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AssociationService } from './associations.service';

describe('AssociationService', () => {
  let service: AssociationService;
  let httpClient: jest.Mocked<HttpClient>;
  let appConfig: any;

  beforeEach(() => {
    const httpClientSpy = {
      get: jest.fn(),
    } as any;
    appConfig = { apiUrl: 'http://localhost:3333/api' };

    TestBed.configureTestingModule({
      providers: [
        AssociationService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(AssociationService);
    httpClient = TestBed.inject(HttpClient) as jest.Mocked<HttpClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('associations', () => {
    it('should get all associations', (done) => {
      const mockAssociations = [
        { id: 1, name: 'Association A', country: 'USA' },
        { id: 2, name: 'Association B', country: 'Canada' },
      ];
      httpClient.get.mockReturnValue(of(mockAssociations));

      service.associations().subscribe((result) => {
        expect(result).toEqual(mockAssociations);
        done();
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/associations'
      );
    });
  });

  describe('getAssociations', () => {
    it('should return formatted SelectItem array', (done) => {
      const mockAssociationsResponse = [
        { id: 1, name: 'Association A', country: 'USA' },
        { id: 2, name: 'Association B', country: 'Canada' },
      ];
      httpClient.get.mockReturnValue(of(mockAssociationsResponse));

      service.getAssociations().subscribe((result) => {
        expect(result).toEqual([
          { label: 'Association A', value: 1 },
          { label: 'Association B', value: 2 },
        ]);
        done();
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        'http://localhost:3333/api/associations'
      );
    });

    it('should handle empty associations response', (done) => {
      httpClient.get.mockReturnValue(of([]));

      service.getAssociations().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});