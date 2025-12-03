import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from './associations.service';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../supabase';

describe('AssociationsService', () => {
  let service: AssociationsService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssociationsService],
    }).compile();

    service = module.get<AssociationsService>(AssociationsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAssociation', () => {
    const mockAssociationData = {
      id: 1,
      name: 'Test Association',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      leagues: ['{"id": "1", "name": "Test League"}'],
      teams: ['{"id": "1", "name": "Test Team"}'],
    };

    it('should return an association when found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [mockAssociationData],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getAssociation(1);

      expect(mockSupabase.from).toHaveBeenCalledWith('associationsfull');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('Test Association');
    });

    it('should return null when no association is found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getAssociation(999);

      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      await expect(service.getAssociation(1)).rejects.toThrow(
        'Failed to fetch association data',
      );
    });

    it('should parse JSON fields correctly', async () => {
      const mockAssociationWithJSON = {
        ...mockAssociationData,
        leagues: ['{"id": "1", "name": "Hockey League", "abbreviation": "HL"}'],
        teams: ['{"id": "1", "name": "Test Team", "age": "12u"}'],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [mockAssociationWithJSON],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await service.getAssociation(1);

      expect(result?.leagues).toHaveLength(1);
      expect(result?.leagues[0]).toEqual({
        id: '1',
        name: 'Hockey League',
        abbreviation: 'HL',
      });
      expect(result?.teams).toHaveLength(1);
      expect(result?.teams[0]).toEqual({
        id: '1',
        name: 'Test Team',
        age: '12u',
      });
    });
  });

  describe('getAssociations', () => {
    const mockAssociationsData = [
      {
        id: 1,
        name: 'Association 1',
        city: 'City 1',
        state: 'State 1',
        country: 'Country 1',
        leagues: ['{"id": "1", "name": "League 1"}'],
        teams: ['{"id": "1", "name": "Team 1"}'],
      },
      {
        id: 2,
        name: 'Association 2',
        city: 'City 2',
        state: 'State 2',
        country: 'Country 2',
        leagues: ['{"id": "2", "name": "League 2"}'],
        teams: ['{"id": "2", "name": "Team 2"}'],
      },
    ];

    it('should return associations filtered by city and state', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike1 = jest.fn().mockReturnThis();
      const mockIlike2 = jest.fn().mockResolvedValue({
        data: mockAssociationsData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike1,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike1,
      });

      mockIlike1.mockReturnValue({
        ilike: mockIlike2,
      });

      const result = await service.getAssociations(
        'Test City',
        undefined,
        'Test State',
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('associationsfull');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIlike1).toHaveBeenCalledWith('city', '%Test City%');
      expect(mockIlike2).toHaveBeenCalledWith('state', '%Test State%');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no associations found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike1 = jest.fn().mockReturnThis();
      const mockIlike2 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike1,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike1,
      });

      mockIlike1.mockReturnValue({
        ilike: mockIlike2,
      });

      const result = await service.getAssociations(
        'Nonexistent',
        undefined,
        'Nonexistent',
      );

      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike1 = jest.fn().mockReturnThis();
      const mockIlike2 = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        ilike: mockIlike1,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike1,
      });

      mockIlike1.mockReturnValue({
        ilike: mockIlike2,
      });

      await expect(service.getAssociations('Test', 'Test')).rejects.toThrow(
        'Failed to fetch associations data',
      );
    });

    it('should handle empty search parameters', async () => {
      const mockQuery = {
        ilike: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      // Create a thenable object that resolves to the data
      Object.assign(mockQuery, {
        then(onfulfilled: any) {
          return Promise.resolve({
            data: mockAssociationsData,
            error: null,
          }).then(onfulfilled);
        },
      });

      const mockSelect = jest.fn().mockReturnValue(mockQuery);

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await service.getAssociations(
        undefined,
        undefined,
        undefined,
      );

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockQuery.ilike).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });
});
