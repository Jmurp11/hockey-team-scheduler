import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [LoadingService],
    }).compileComponents();
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with loading false', () => {
    expect(service.isLoading()).toBe(false);
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);

      service.setLoading(false);
      expect(service.isLoading()).toBe(false);
    });

    it('should toggle loading state multiple times', () => {
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);

      service.setLoading(false);
      expect(service.isLoading()).toBe(false);

      service.setLoading(true);
      expect(service.isLoading()).toBe(true);
    });
  });

  describe('isLoading', () => {
    it('should return current loading state', () => {
      expect(service.isLoading()).toBe(false);

      service.setLoading(true);
      expect(service.isLoading()).toBe(true);
    });

    it('should be a function that returns boolean', () => {
      expect(typeof service.isLoading).toBe('function');
      expect(typeof service.isLoading()).toBe('boolean');
    });
  });
});
