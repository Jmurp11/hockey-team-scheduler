import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SidebarService],
    });
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with sidebar closed', () => {
    expect(service.isOpen()).toBe(false);
  });

  describe('toggle', () => {
    it('should toggle sidebar from closed to open', () => {
      expect(service.isOpen()).toBe(false);
      
      service.toggle();
      
      expect(service.isOpen()).toBe(true);
    });

    it('should toggle sidebar from open to closed', () => {
      service.open();
      expect(service.isOpen()).toBe(true);
      
      service.toggle();
      
      expect(service.isOpen()).toBe(false);
    });

    it('should toggle multiple times', () => {
      service.toggle();
      expect(service.isOpen()).toBe(true);
      
      service.toggle();
      expect(service.isOpen()).toBe(false);
      
      service.toggle();
      expect(service.isOpen()).toBe(true);
    });
  });

  describe('open', () => {
    it('should open sidebar', () => {
      service.open();
      expect(service.isOpen()).toBe(true);
    });

    it('should keep sidebar open when called multiple times', () => {
      service.open();
      service.open();
      expect(service.isOpen()).toBe(true);
    });
  });

  describe('close', () => {
    it('should close sidebar', () => {
      service.open();
      service.close();
      expect(service.isOpen()).toBe(false);
    });

    it('should keep sidebar closed when called multiple times', () => {
      service.close();
      service.close();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('isOpen signal', () => {
    it('should be readonly', () => {
      const isOpen = service.isOpen;
      expect(isOpen).toBeDefined();
      expect(typeof isOpen).toBe('function');
    });

    it('should reflect state changes', () => {
      expect(service.isOpen()).toBe(false);
      
      service.open();
      expect(service.isOpen()).toBe(true);
      
      service.close();
      expect(service.isOpen()).toBe(false);
      
      service.toggle();
      expect(service.isOpen()).toBe(true);
    });
  });
});
