import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('navigateToLink', () => {
    it('should navigate to provided route', () => {
      service.navigateToLink('/home');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to root route', () => {
      service.navigateToLink('/');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to nested route', () => {
      service.navigateToLink('/users/profile/edit');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/profile/edit']);
    });

    it('should navigate to route with query params format', () => {
      service.navigateToLink('/search?q=test');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/search?q=test']);
    });

    it('should call navigate only once per call', () => {
      service.navigateToLink('/dashboard');
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple navigation calls', () => {
      service.navigateToLink('/page1');
      service.navigateToLink('/page2');
      service.navigateToLink('/page3');
      
      expect(mockRouter.navigate).toHaveBeenCalledTimes(3);
      expect(mockRouter.navigate).toHaveBeenNthCalledWith(1, ['/page1']);
      expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, ['/page2']);
      expect(mockRouter.navigate).toHaveBeenNthCalledWith(3, ['/page3']);
    });
  });
});
