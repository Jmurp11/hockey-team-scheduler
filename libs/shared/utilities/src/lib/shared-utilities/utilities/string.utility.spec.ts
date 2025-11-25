import { getInitials } from './string.utility';

describe('string.utility', () => {
  describe('getInitials', () => {
    it('should return initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should return initials from three-part name', () => {
      expect(getInitials('John Michael Doe')).toBe('JMD');
    });

    it('should return single initial for single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle uppercase names', () => {
      expect(getInitials('JOHN DOE')).toBe('JD');
    });

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD');
    });

    it('should handle mixed case names', () => {
      expect(getInitials('JoHn DoE')).toBe('JD');
    });

    it('should return empty string for empty input', () => {
      expect(getInitials('')).toBe('');
    });

    it('should handle names with extra spaces', () => {
      expect(getInitials('John  Doe')).toBe('JD');
    });

    it('should handle single character names', () => {
      expect(getInitials('J D')).toBe('JD');
    });
  });
});
