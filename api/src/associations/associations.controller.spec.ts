import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsController } from './associations.controller';
import { AssociationsService } from './associations.service';
import { AssociationFull } from '../types';

describe('AssociationsController', () => {
  let controller: AssociationsController;
  let service: AssociationsService;

  const mockAssociationsService = {
    getAssociation: jest.fn(),
    getAssociations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssociationsController],
      providers: [
        {
          provide: AssociationsService,
          useValue: mockAssociationsService,
        },
      ],
    }).compile();

    controller = module.get<AssociationsController>(AssociationsController);
    service = module.get<AssociationsService>(AssociationsService);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAssociation', () => {
    const mockAssociation: AssociationFull = {
      id: '1',
      name: 'Test Association',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      leagues: [
        {
          id: '1',
          name: 'Test League',
          abbreviation: 'TL',
          location: 'Test Location',
        },
      ],
      teams: [
        {
          id: '1',
          name: 'Test Team',
          age: '12u',
          rating: 1500,
          record: '10-5-2',
          agd: 2.5,
          sched: 1200,
          association: {
            id: '1',
            name: 'Test Association',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
          },
        },
      ],
    };

    it('should return an association when found', async () => {
      mockAssociationsService.getAssociation.mockResolvedValue(mockAssociation);

      const result = await controller.getAssociation('1');

      expect(service.getAssociation).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAssociation);
    });

    it('should return null when association not found', async () => {
      mockAssociationsService.getAssociation.mockResolvedValue(null);

      const result = await controller.getAssociation('999');

      expect(service.getAssociation).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      mockAssociationsService.getAssociation.mockRejectedValue(new Error('Service error'));

      await expect(controller.getAssociation('1')).rejects.toThrow('Service error');
      expect(service.getAssociation).toHaveBeenCalledWith(1);
    });

    it('should parse string ID to number', async () => {
      mockAssociationsService.getAssociation.mockResolvedValue(mockAssociation);

      await controller.getAssociation('123');

      expect(service.getAssociation).toHaveBeenCalledWith(123);
    });

    it('should handle invalid ID format', async () => {
      mockAssociationsService.getAssociation.mockResolvedValue(null);

      await controller.getAssociation('invalid');

      // parseInt('invalid') returns NaN, but the service should handle this
      expect(service.getAssociation).toHaveBeenCalledWith(NaN);
    });
  });

  describe('getAssociations', () => {
    const mockAssociations: AssociationFull[] = [
      {
        id: '1',
        name: 'Association 1',
        city: 'City 1',
        state: 'State 1',
        country: 'Country 1',
        leagues: [],
        teams: [],
      },
      {
        id: '2',
        name: 'Association 2',
        city: 'City 2',
        state: 'State 2',
        country: 'Country 2',
        leagues: [],
        teams: [],
      },
    ];

    it('should return associations with city and state filters', async () => {
      mockAssociationsService.getAssociations.mockResolvedValue(mockAssociations);

      const result = await controller.getAssociations('Test City', 'Test State');

      expect(service.getAssociations).toHaveBeenCalledWith('Test City', 'Test State');
      expect(result).toEqual(mockAssociations);
      expect(result).toHaveLength(2);
    });

    it('should return associations with default empty filters', async () => {
      mockAssociationsService.getAssociations.mockResolvedValue(mockAssociations);

      const result = await controller.getAssociations();

      expect(service.getAssociations).toHaveBeenCalledWith('', '');
      expect(result).toEqual(mockAssociations);
    });

    it('should return empty array when no associations found', async () => {
      mockAssociationsService.getAssociations.mockResolvedValue([]);

      const result = await controller.getAssociations('Nonexistent', 'Nonexistent');

      expect(service.getAssociations).toHaveBeenCalledWith('Nonexistent', 'Nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockAssociationsService.getAssociations.mockRejectedValue(new Error('Service error'));

      await expect(controller.getAssociations('Test', 'Test')).rejects.toThrow('Service error');
      expect(service.getAssociations).toHaveBeenCalledWith('Test', 'Test');
    });

    it('should handle undefined query parameters', async () => {
      mockAssociationsService.getAssociations.mockResolvedValue(mockAssociations);

      const result = await controller.getAssociations(undefined, undefined);

      expect(service.getAssociations).toHaveBeenCalledWith('', '');
      expect(result).toEqual(mockAssociations);
    });

    it('should handle partial query parameters', async () => {
      mockAssociationsService.getAssociations.mockResolvedValue(mockAssociations);

      // Test with only city
      await controller.getAssociations('Test City');
      expect(service.getAssociations).toHaveBeenCalledWith('Test City', '');

      // Test with only state (city as undefined)
      await controller.getAssociations(undefined, 'Test State');
      expect(service.getAssociations).toHaveBeenCalledWith('', 'Test State');
    });
  });
});
