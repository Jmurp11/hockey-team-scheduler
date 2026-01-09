import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ContactSchedulerDialogService } from './contact-scheduler.service';

/**
 * Tests for ContactSchedulerDialogService
 *
 * This service manages the state of the contact scheduler dialog modal.
 * It uses Angular signals to expose readonly state and provides methods
 * to open and close the modal with manager data.
 *
 * Key behaviors tested:
 * - Signal-based state management
 * - Modal open/close functionality
 * - Manager data handling
 * - Animation delay handling on close
 */
describe('ContactSchedulerDialogService', () => {
  let service: ContactSchedulerDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContactSchedulerDialogService],
    });
    service = TestBed.inject(ContactSchedulerDialogService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize with modal closed', () => {
      expect(service.isOpen()).toBe(false);
    });

    it('should initialize with null manager data', () => {
      expect(service.managerData()).toBeNull();
    });

    it('should provide readonly signals', () => {
      // Signals should be callable functions that return values
      expect(typeof service.isOpen).toBe('function');
      expect(typeof service.managerData).toBe('function');
    });
  });

  describe('openModal', () => {
    const mockManager = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
    };

    it('should open modal when manager data is provided', () => {
      service.openModal(mockManager as any);

      expect(service.isOpen()).toBe(true);
    });

    it('should set manager data when provided', () => {
      service.openModal(mockManager as any);

      expect(service.managerData()).toEqual(mockManager);
    });

    it('should NOT open modal when manager data is null', () => {
      service.openModal(null);

      expect(service.isOpen()).toBe(false);
      expect(service.managerData()).toBeNull();
    });

    it('should NOT open modal when no parameters provided', () => {
      service.openModal();

      expect(service.isOpen()).toBe(false);
    });

    it('should override previous manager data when opening with new data', () => {
      const firstManager = { id: 1, firstName: 'John' };
      const secondManager = { id: 2, firstName: 'Jane' };

      service.openModal(firstManager as any);
      expect(service.managerData()).toEqual(firstManager);

      service.openModal(secondManager as any);
      expect(service.managerData()).toEqual(secondManager);
    });

    it('should handle manager with minimal data', () => {
      const minimalManager = { id: 1 };

      service.openModal(minimalManager as any);

      expect(service.isOpen()).toBe(true);
      expect(service.managerData()).toEqual(minimalManager);
    });

    it('should handle manager with all fields populated', () => {
      const fullManager = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        teamName: 'Thunderbirds',
        association: { id: 1, name: 'Hockey Association' },
      };

      service.openModal(fullManager as any);

      expect(service.isOpen()).toBe(true);
      expect(service.managerData()).toEqual(fullManager);
    });
  });

  describe('closeModal', () => {
    const mockManager = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      // Set up initial open state
      service.openModal(mockManager as any);
    });

    it('should close modal immediately', () => {
      service.closeModal();

      expect(service.isOpen()).toBe(false);
    });

    it('should retain manager data immediately after close', () => {
      service.closeModal();

      // Manager data should still be present immediately
      // This allows for exit animations
      expect(service.managerData()).toEqual(mockManager);
    });

    it('should clear manager data after animation delay', fakeAsync(() => {
      jest.useFakeTimers();

      service.closeModal();

      // Immediately after close, data should still be there
      expect(service.managerData()).toEqual(mockManager);

      // After 300ms (animation delay), data should be cleared
      jest.advanceTimersByTime(300);
      tick();

      expect(service.managerData()).toBeNull();
    }));

    it('should handle multiple close calls gracefully', () => {
      service.closeModal();
      expect(service.isOpen()).toBe(false);

      // Second close should not throw
      expect(() => service.closeModal()).not.toThrow();
      expect(service.isOpen()).toBe(false);
    });

    it('should handle close when modal is already closed', () => {
      // Close first time
      service.closeModal();

      // Close second time
      expect(() => service.closeModal()).not.toThrow();
    });
  });

  describe('open and close cycle', () => {
    const mockManager = {
      id: 1,
      firstName: 'John',
    };

    it('should support complete open-close-reopen cycle', fakeAsync(() => {
      jest.useFakeTimers();

      // Open
      service.openModal(mockManager as any);
      expect(service.isOpen()).toBe(true);
      expect(service.managerData()).toEqual(mockManager);

      // Close
      service.closeModal();
      expect(service.isOpen()).toBe(false);

      // Wait for data clear
      jest.advanceTimersByTime(300);
      tick();
      expect(service.managerData()).toBeNull();

      // Reopen with new data
      const newManager = { id: 2, firstName: 'Jane' };
      service.openModal(newManager as any);
      expect(service.isOpen()).toBe(true);
      expect(service.managerData()).toEqual(newManager);
    }));

    it('should allow immediate reopen after close without waiting for animation', () => {
      service.openModal(mockManager as any);
      service.closeModal();

      // Immediately reopen with new data
      const newManager = { id: 2, firstName: 'Jane' };
      service.openModal(newManager as any);

      expect(service.isOpen()).toBe(true);
      expect(service.managerData()).toEqual(newManager);
    });
  });

  describe('signal immutability', () => {
    it('should not allow direct mutation of isOpen from outside', () => {
      // The service exposes isOpen as a readonly signal
      // Attempting to call .set() should not exist on the public interface
      expect((service.isOpen as any).set).toBeUndefined();
    });

    it('should not allow direct mutation of managerData from outside', () => {
      // The service exposes managerData as a readonly signal
      expect((service.managerData as any).set).toBeUndefined();
    });
  });
});
