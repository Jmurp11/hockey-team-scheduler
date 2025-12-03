import { TestBed } from '@angular/core/testing';
import { AddGameModalService } from './add-game-modal.service';

describe('AddGameModalService', () => {
  let service: AddGameModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AddGameModalService],
    });
    service = TestBed.inject(AddGameModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.isOpen()).toBe(false);
    expect(service.gameData()).toBeNull();
    expect(service.editMode()).toBe(false);
  });

  describe('openModal', () => {
    it('should open modal with default values when no parameters provided', () => {
      service.openModal();

      expect(service.isOpen()).toBe(true);
      expect(service.gameData()).toBeNull();
      expect(service.editMode()).toBe(false);
    });

    it('should open modal with game data provided', () => {
      const mockGame = {
        id: '1',
        opponent: 'Team A',
        date: new Date('2024-01-01'),
        time: '14:00',
        isHome: true,
        location: 'Arena 1',
      };

      service.openModal(mockGame);

      expect(service.isOpen()).toBe(true);
      expect(service.gameData()).toEqual(mockGame);
      expect(service.editMode()).toBe(false);
    });

    it('should open modal in edit mode', () => {
      const mockGame = {
        id: '2',
        opponent: 'Team B',
        date: new Date('2024-01-02'),
        time: '16:00',
        isHome: false,
        location: 'Arena 2',
      };

      service.openModal(mockGame, true);

      expect(service.isOpen()).toBe(true);
      expect(service.gameData()).toEqual(mockGame);
      expect(service.editMode()).toBe(true);
    });

    it('should open modal with null game data and edit mode true', () => {
      service.openModal(null, true);

      expect(service.isOpen()).toBe(true);
      expect(service.gameData()).toBeNull();
      expect(service.editMode()).toBe(true);
    });

    it('should override previous modal state when called multiple times', () => {
      const firstGame = {
        id: '1',
        opponent: 'Team A',
        date: new Date('2024-01-01'),
        time: '14:00',
        isHome: true,
        location: 'Arena 1',
      };

      const secondGame = {
        id: '2',
        opponent: 'Team B',
        date: new Date('2024-01-02'),
        time: '16:00',
        isHome: false,
        location: 'Arena 2',
      };

      service.openModal(firstGame, false);
      expect(service.gameData()).toEqual(firstGame);
      expect(service.editMode()).toBe(false);

      service.openModal(secondGame, true);
      expect(service.gameData()).toEqual(secondGame);
      expect(service.editMode()).toBe(true);
    });
  });

  describe('closeModal', () => {
    beforeEach(() => {
      // Set up modal with some data first
      const mockGame = {
        id: '1',
        opponent: 'Team A',
        date: new Date('2024-01-01'),
        time: '14:00',
        isHome: true,
        location: 'Arena 1',
      };
      service.openModal(mockGame, true);
    });

    it('should immediately close modal', () => {
      service.closeModal();

      expect(service.isOpen()).toBe(false);
      // Game data and edit mode should still be set initially
      expect(service.gameData()).toBeTruthy();
      expect(service.editMode()).toBe(true);
    });

    it('should reset game data and edit mode after timeout', (done) => {
      service.closeModal();

      expect(service.isOpen()).toBe(false);

      // Wait for the timeout (300ms) plus a small buffer
      setTimeout(() => {
        expect(service.gameData()).toBeNull();
        expect(service.editMode()).toBe(false);
        done();
      }, 350);
    });

    it('should work when modal is already closed', () => {
      service.closeModal(); // First close
      
      expect(() => service.closeModal()).not.toThrow(); // Second close should not throw
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('signal readonly properties', () => {
    it('should provide readonly access to signals', () => {
      // These should be readonly signals, so they should have the signal interface
      // but not allow direct mutation
      expect(typeof service.isOpen).toBe('function');
      expect(typeof service.gameData).toBe('function');
      expect(typeof service.editMode).toBe('function');

      // Verify we can read the values
      expect(service.isOpen()).toBe(false);
      expect(service.gameData()).toBeNull();
      expect(service.editMode()).toBe(false);
    });
  });
});