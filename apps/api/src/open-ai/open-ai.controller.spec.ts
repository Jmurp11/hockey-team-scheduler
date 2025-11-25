import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiController } from './open-ai.controller';
import { OpenAiService } from './open-ai.service';
import { ContactSchedulerDto } from './open-ai.types';

describe('OpenAiController', () => {
  let controller: OpenAiController;

  const mockOpenAiService = {
    contactScheduler: jest.fn(),
    generateReply: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenAiController],
      providers: [
        {
          provide: OpenAiService,
          useValue: mockOpenAiService,
        },
      ],
    }).compile();

    controller = module.get<OpenAiController>(OpenAiController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('contactScheduler', () => {
    it('should contact scheduler successfully', async () => {
      const contactDto: ContactSchedulerDto = {
        team: 'Boston Bears',
        location: 'Boston, MA',
      };

      const mockResponse = {
        managers: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            sourceUrl: 'https://example.com/contact',
          },
        ],
      };

      mockOpenAiService.contactScheduler.mockResolvedValue(mockResponse);

      const result = await controller.contactScheduler(contactDto);

      expect(mockOpenAiService.contactScheduler).toHaveBeenCalledWith(
        contactDto,
      );
      expect(result).toEqual(mockResponse as any);
    });

    it('should handle errors from service', async () => {
      const contactDto: ContactSchedulerDto = {
        team: 'Test Team',
        location: 'Test Location',
      };

      mockOpenAiService.contactScheduler.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      await expect(controller.contactScheduler(contactDto)).rejects.toThrow(
        'OpenAI API error',
      );
    });

    it('should handle empty results', async () => {
      const contactDto: ContactSchedulerDto = {
        team: 'Nonexistent Team',
        location: 'Nowhere',
      };

      const mockResponse = {
        managers: [],
      };

      mockOpenAiService.contactScheduler.mockResolvedValue(mockResponse);

      const result = await controller.contactScheduler(contactDto);

      expect(mockOpenAiService.contactScheduler).toHaveBeenCalledWith(
        contactDto,
      );
      expect(result).toEqual(mockResponse as any);
    });
  });
});
