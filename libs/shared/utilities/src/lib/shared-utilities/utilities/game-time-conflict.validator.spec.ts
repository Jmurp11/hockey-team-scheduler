import { FormControl } from '@angular/forms';
import { gameTimeConflictValidator } from './game-time-conflict.validator';
import { Game } from '../types/game.type';

describe('gameTimeConflictValidator', () => {
  const createGame = (date: string, time: string, id?: string): Game & { originalTime?: string } => ({
    id: id || 'test-game-1',
    created_at: '2024-01-01T00:00:00Z',
    date: new Date(date + 'T00:00:00'), // Use local time for consistency
    time: time,
    originalTime: time,
    opponent: { label: 'Test Opponent', value: 1 },
    rink: 'Test Rink',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    game_type: 'league',
    isHome: true,
    user: 1
  });

  describe('when no existing games', () => {
    it('should return null for valid date', () => {
      const validator = gameTimeConflictValidator([]);
      const control = new FormControl(new Date('2024-01-01T14:00:00'));
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });

    it('should return null when existing games is null', () => {
      const validator = gameTimeConflictValidator(null);
      const control = new FormControl(new Date('2024-01-01T14:00:00'));
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });
  });

  describe('when checking time conflicts', () => {
    const existingGames = [
      createGame('2024-01-01', '14:00:00'), // 2:00 PM
      createGame('2024-01-02', '10:30:00'), // 10:30 AM different day
    ];

    it('should return null when no conflict exists (different day)', () => {
      const validator = gameTimeConflictValidator(existingGames);
      const control = new FormControl(new Date('2024-01-03T16:00:00')); // Different day
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });

    it('should return null when no conflict exists (same day, more than 4 hours apart)', () => {
      const validator = gameTimeConflictValidator(existingGames);
      const control = new FormControl(new Date('2024-01-01T20:00:00')); // 8:00 PM, 6 hours after existing game
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });

    it('should return error when conflict exists (within 4 hours)', () => {
      const validator = gameTimeConflictValidator(existingGames);
      const control = new FormControl(new Date('2024-01-01T16:00:00')); // 4:00 PM, 2 hours after existing game
      
      const result = validator(control);
      
      expect(result).toEqual({
        gameTimeConflict: {
          message: 'Cannot schedule game within 4 hours of existing game at 2:00 PM',
          conflictingTime: '2:00 PM',
          conflictingGameId: 'test-game-1'
        }
      });
    });

    it('should return error when conflict exists (before existing game)', () => {
      const validator = gameTimeConflictValidator(existingGames);
      const control = new FormControl(new Date('2024-01-01T12:00:00')); // 12:00 PM, 2 hours before existing game
      
      const result = validator(control);
      
      expect(result).toEqual({
        gameTimeConflict: {
          message: 'Cannot schedule game within 4 hours of existing game at 2:00 PM',
          conflictingTime: '2:00 PM',
          conflictingGameId: 'test-game-1'
        }
      });
    });

    it('should allow exactly 4 hours difference', () => {
      const validator = gameTimeConflictValidator(existingGames);
      const control = new FormControl(new Date('2024-01-01T18:00:00')); // 6:00 PM, exactly 4 hours after existing game
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });

    it('should allow exactly 4 hours before', () => {
      const validator = gameTimeConflictValidator(existingGames);
      const control = new FormControl(new Date('2024-01-01T10:00:00')); // 10:00 AM, exactly 4 hours before existing game
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });
  });

  describe('when editing existing game', () => {
    const existingGames = [
      createGame('2024-01-01', '14:00:00', 'edit-game-1'),
      createGame('2024-01-01', '20:00:00', 'other-game-1'),
    ];

    it('should exclude current game from conflict check', () => {
      const validator = gameTimeConflictValidator(existingGames, 'edit-game-1');
      const control = new FormControl(new Date('2024-01-01T14:30:00')); // 30 minutes after original time
      
      const result = validator(control);
      
      expect(result).toBeNull();
    });

    it('should still check conflict with other games', () => {
      const validator = gameTimeConflictValidator(existingGames, 'edit-game-1');
      const control = new FormControl(new Date('2024-01-01T19:00:00')); // 1 hour before other game
      
      const result = validator(control);
      
      expect(result).toEqual({
        gameTimeConflict: {
          message: 'Cannot schedule game within 4 hours of existing game at 8:00 PM',
          conflictingTime: '8:00 PM',
          conflictingGameId: 'other-game-1'
        }
      });
    });
  });

  describe('time parsing edge cases', () => {
    it('should handle 12-hour format with AM/PM', () => {
      const gamesWithAmPm = [
        { ...createGame('2024-01-01', '2:00 PM'), originalTime: '2:00 PM' }
      ];
      
      const validator = gameTimeConflictValidator(gamesWithAmPm);
      const control = new FormControl(new Date('2024-01-01T15:00:00')); // 3:00 PM, 1 hour after
      
      const result = validator(control);
      
      expect(result).toEqual({
        gameTimeConflict: {
          message: 'Cannot schedule game within 4 hours of existing game at 2:00 PM',
          conflictingTime: '2:00 PM',
          conflictingGameId: 'test-game-1'
        }
      });
    });

    it('should handle 24-hour format with timezone', () => {
      const gamesWithTimezone = [
        { ...createGame('2024-01-01', '14:00:00+00'), originalTime: '14:00:00+00' }
      ];
      
      const validator = gameTimeConflictValidator(gamesWithTimezone);
      const control = new FormControl(new Date('2024-01-01T15:00:00')); // 3:00 PM, 1 hour after
      
      const result = validator(control);
      
      expect(result).toEqual({
        gameTimeConflict: {
          message: 'Cannot schedule game within 4 hours of existing game at 2:00 PM',
          conflictingTime: '2:00 PM',
          conflictingGameId: 'test-game-1'
        }
      });
    });

    it('should handle midnight edge cases', () => {
      const midnightGames = [
        createGame('2024-01-01', '23:00:00'), // 11:00 PM
      ];
      
      const validator = gameTimeConflictValidator(midnightGames);
      const control = new FormControl(new Date('2024-01-02T01:00:00')); // 1:00 AM next day, 2 hours later
      
      const result = validator(control);
      
      expect(result).toBeNull(); // Different day, so no conflict
    });
  });
});