import { sort } from './sort.utility';

describe('sort.utility', () => {
  describe('sort', () => {
    const mockItems = [
      { id: 1, name: 'Charlie', age: 30 },
      { id: 2, name: 'Alice', age: 25 },
      { id: 3, name: 'Bob', age: 35 },
    ];

    it('should sort items in ascending order by field', () => {
      const items = [...mockItems];
      const result = sort(items, { field: 'name', sortDirection: 'asc' });

      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort items in descending order by field', () => {
      const items = [...mockItems];
      const result = sort(items, { field: 'name', sortDirection: 'desc' });

      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });

    it('should sort numeric fields in ascending order', () => {
      const items = [...mockItems];
      const result = sort(items, { field: 'age', sortDirection: 'asc' });

      expect(result[0].age).toBe(25);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(35);
    });

    it('should sort numeric fields in descending order', () => {
      const items = [...mockItems];
      const result = sort(items, { field: 'age', sortDirection: 'desc' });

      expect(result[0].age).toBe(35);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(25);
    });

    it('should handle empty array', () => {
      const result = sort([], { field: 'name', sortDirection: 'asc' });
      expect(result).toEqual([]);
    });

    it('should handle single item array', () => {
      const items = [{ id: 1, name: 'Alice' }];
      const result = sort(items, { field: 'name', sortDirection: 'asc' });
      expect(result).toEqual(items);
    });

    it('should handle items with equal field values', () => {
      const items = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 25 },
      ];
      const result = sort(items, { field: 'age', sortDirection: 'asc' });
      
      expect(result.every(item => item.age === 25)).toBe(true);
    });

    it('should mutate the original array', () => {
      const items = [...mockItems];
      const originalFirstItem = items[0];
      
      sort(items, { field: 'name', sortDirection: 'asc' });
      
      // After sorting, first item should be different
      expect(items[0]).not.toBe(originalFirstItem);
      expect(items[0].name).toBe('Alice');
    });
  });
});
