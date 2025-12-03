import { combineDateAndTime, formatTime } from './time.utility';

describe('time.utility', () => {
  describe('formatTime', () => {
    it('should format 24-hour time to 12-hour AM format', () => {
      const result = formatTime('09:30');
      expect(result).toMatch(/9:30\s*AM/i);
    });

    it('should format 24-hour time to 12-hour PM format', () => {
      const result = formatTime('14:45');
      expect(result).toMatch(/2:45\s*PM/i);
    });

    it('should format midnight correctly', () => {
      const result = formatTime('00:00');
      expect(result).toMatch(/12:00\s*AM/i);
    });

    it('should format noon correctly', () => {
      const result = formatTime('12:00');
      expect(result).toMatch(/12:00\s*PM/i);
    });

    it('should handle single digit minutes', () => {
      const result = formatTime('10:05');
      expect(result).toMatch(/10:05\s*AM/i);
    });
  });

  describe('combineDateAndTime', () => {
    it('should combine date and time strings into a Date object', () => {
      const result = combineDateAndTime('2024-03-15', '14:30:00');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle time without seconds', () => {
      const result = combineDateAndTime('2024-03-15', '14:30');
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('should return date only when time is not provided', () => {
      const result = combineDateAndTime('2024-03-15');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2);
      expect(result.getDate()).toBe(15);
    });

    it('should handle time with timezone offset', () => {
      const result = combineDateAndTime('2024-03-15', '14:30:00+05');
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should handle midnight time', () => {
      const result = combineDateAndTime('2024-03-15', '00:00:00');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle end of day time', () => {
      const result = combineDateAndTime('2024-03-15', '23:59:59');
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });
});
