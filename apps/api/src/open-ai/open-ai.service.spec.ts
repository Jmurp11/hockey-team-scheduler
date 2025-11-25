import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService, SchedulerProps } from './open-ai.service';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock OpenAI
jest.mock('openai', () => {
  const mockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    responses: {
      create: jest.fn(),
    },
  }));

  return {
    OpenAI: mockOpenAI,
  };
});

import { supabase } from '../supabase';

describe('OpenAiService', () => {
  let service: OpenAiService;
  let mockSupabase: any;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAiService],
    }).compile();

    service = module.get<OpenAiService>(OpenAiService);
    mockSupabase = supabase;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReply', () => {
    it('should generate AI reply for conversation', async () => {
      const conversationId = 'conv-1';
      const mockMessages = [
        {
          conversation_id: conversationId,
          sender: 'user',
          content: 'Hello',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          conversation_id: conversationId,
          sender: 'contact',
          content: 'Hi there',
          created_at: '2024-01-15T10:01:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockMessages });
      const mockLimit = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as jest.Mock) = mockFrom;

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: 'Sure, that works for us!',
            },
          },
        ],
      };

      service.client.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockAIResponse);

      const result = await service.generateReply(conversationId);

      expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      expect(result).toBe('Sure, that works for us!');
    });

    it('should throw error when no messages found', async () => {
      const conversationId = 'conv-1';

      const mockOrder = jest.fn().mockResolvedValue({ data: [] });
      const mockLimit = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as jest.Mock) = mockFrom;

      await expect(service.generateReply(conversationId)).rejects.toThrow(
        'No messages found for conversation',
      );
    });
  });

  describe('contactScheduler', () => {
    it('should return existing manager if found', async () => {
      const props: SchedulerProps = {
        team: 'Test Team',
        location: 'Test Location',
      };

      const mockExistingManager = [
        {
          id: 'manager-1',
          name: 'John Doe',
          team: 'Test Team',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      ];

      const mockIlike = jest
        .fn()
        .mockResolvedValue({ data: mockExistingManager, error: null });
      const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await service.contactScheduler(props);

      expect(mockSupabase.from).toHaveBeenCalledWith('managers');
      expect(result).toEqual(mockExistingManager);
    });

    it('should fetch from OpenAI if no existing manager found', async () => {
      const props: SchedulerProps = {
        team: 'New Team',
        location: 'New Location',
      };

      // Mock empty existing manager check
      const mockIlike = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike });

      // Mock insert
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'managers') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        return null;
      });

      (supabase.from as jest.Mock) = mockFrom;

      const mockAIResponse = {
        output_text: JSON.stringify({
          managers: [
            {
              name: 'Jane Smith cite[1]',
              email: 'jane@example.com cite[1]',
              phone: '+9876543210 cite[1]',
              sourceUrl: 'https://example.com cite[1]',
            },
          ],
        }),
      };

      service.client.responses.create = jest
        .fn()
        .mockResolvedValue(mockAIResponse);

      await service.contactScheduler(props);

      // Verify the manager was inserted into the database
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors', async () => {
      const props: SchedulerProps = {
        team: 'Test Team',
        location: 'Test Location',
      };

      const mockIlike = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as jest.Mock) = mockFrom;

      service.client.responses.create = jest
        .fn()
        .mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.contactScheduler(props)).rejects.toThrow(
        'OpenAI API error',
      );
    });
  });

  describe('generateSchedulerPrompt', () => {
    it('should generate correct prompt', () => {
      const props: SchedulerProps = {
        team: 'Boston Bears',
        location: 'Boston, MA',
      };

      const prompt = service.generateSchedulerPrompt(props);

      expect(prompt).toContain('Boston Bears');
      expect(prompt).toContain('Boston, MA');
      expect(prompt).toContain('youth hockey team');
      expect(prompt).toContain('team manager');
    });
  });
});
