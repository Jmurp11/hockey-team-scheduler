import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from '../open-ai/open-ai.service';
import { CreateConversationDto, MessageDto } from '../types';
import { MessageService } from './message.service';

// Mock the supabase module
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock Twilio
jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'test-sid' }),
      },
    })),
  };
});

import { supabase } from '../supabase';

describe('MessageService', () => {
  let service: MessageService;
  let mockTwilioCreate: jest.Mock;

  const mockOpenAiService = {
    generateReply: jest.fn(),
  };

  beforeEach(async () => {
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE = '+1234567890';

    mockTwilioCreate = jest.fn().mockResolvedValue({ sid: 'test-sid' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: OpenAiService,
          useValue: mockOpenAiService,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);

    // Mock the Twilio messages.create method
    service['twilio'] = {
      messages: {
        create: mockTwilioCreate,
      },
    } as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendText', () => {
    it('should send a text message', async () => {
      const to = '+9876543210';
      const body = 'Test message';

      await service.sendText(to, body);

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        to,
        from: process.env.TWILIO_PHONE,
        body,
      });
    });
  });

  describe('sendInitialMessage', () => {
    it('should send initial message and create conversation', async () => {
      const conversationDto: CreateConversationDto = {
        userId: 'user-1',
        contactName: 'John Doe',
        contactTeam: 'Test Team',
        message: 'Hello',
        phone: '+1234567890',
      };

      const mockManager = {
        id: 'manager-1',
        name: 'John Doe',
        team: 'Test Team',
        phone: '+1234567890',
      };

      const mockConversation = {
        id: 'conv-1',
        user_id: 'user-1',
        manager_id: 'manager-1',
        ai_enabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Mock manager lookup
      const mockManagerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockManager, error: null });
      const mockManagerIlike2 = jest
        .fn()
        .mockReturnValue({ single: mockManagerSingle });
      const mockManagerIlike1 = jest
        .fn()
        .mockReturnValue({ ilike: mockManagerIlike2 });
      const mockManagerSelect = jest
        .fn()
        .mockReturnValue({ ilike: mockManagerIlike1 });
      const mockManagerFrom = jest
        .fn()
        .mockReturnValue({ select: mockManagerSelect });

      // Mock conversation creation
      const mockConvSelect = jest
        .fn()
        .mockResolvedValue({ data: [mockConversation], error: null });
      const mockConvInsert = jest
        .fn()
        .mockReturnValue({ select: mockConvSelect });
      const mockConvFrom = jest
        .fn()
        .mockReturnValue({ insert: mockConvInsert });

      // Mock message insertion
      const mockMsgInsert = jest.fn().mockResolvedValue({ error: null });
      const mockMsgFrom = jest.fn().mockReturnValue({ insert: mockMsgInsert });

      (supabase.from as jest.Mock) = jest
        .fn()
        .mockImplementation((table: string): any => {
          if (table === 'managers') return mockManagerFrom();
          if (table === 'conversations') return mockConvFrom();
          if (table === 'messages') return mockMsgFrom();
          return null;
        });

      const result = await service.sendInitialMessage(conversationDto);

      expect(result).toEqual(mockConversation);
    });
  });

  describe('incoming', () => {
    it('should handle incoming message with AI enabled', async () => {
      const messageDto: MessageDto = {
        phone: '+1234567890',
        body: 'Test message',
      };

      const mockManager = {
        id: 'manager-1',
        name: 'John Doe',
        phone: '+1234567890',
      };

      const mockConversation = {
        id: 'conv-1',
        user_id: 'user-1',
        manager_id: 'manager-1',
        ai_enabled: true,
      };

      // Mock manager lookup
      const mockManagerSingle = jest
        .fn()
        .mockResolvedValue({ data: mockManager, error: null });
      const mockManagerIlike = jest
        .fn()
        .mockReturnValue({ single: mockManagerSingle });
      const mockManagerSelect = jest
        .fn()
        .mockReturnValue({ ilike: mockManagerIlike });

      // Mock conversation lookup
      const mockConvSingle = jest
        .fn()
        .mockResolvedValue({ data: mockConversation, error: null });
      const mockConvEq = jest.fn().mockReturnValue({ single: mockConvSingle });
      const mockConvSelect = jest.fn().mockReturnValue({ eq: mockConvEq });

      // Mock message insertion
      const mockMsgInsert = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'managers')
          return { select: mockManagerSelect, ilike: mockManagerIlike };
        if (table === 'conversations')
          return { select: mockConvSelect, eq: mockConvEq };
        if (table === 'messages') return { insert: mockMsgInsert };
        return null;
      });

      (supabase.from as jest.Mock) = mockFrom;
      mockOpenAiService.generateReply.mockResolvedValue('AI response');

      await service.incoming(messageDto);

      expect(mockOpenAiService.generateReply).toHaveBeenCalledWith('conv-1');
    });

    it('should throw error for unknown contact', async () => {
      const messageDto: MessageDto = {
        phone: '+0000000000',
        body: 'Test message',
      };

      const mockManagerSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });
      const mockManagerIlike = jest
        .fn()
        .mockReturnValue({ single: mockManagerSingle });
      const mockManagerSelect = jest
        .fn()
        .mockReturnValue({ ilike: mockManagerIlike });

      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({
        select: mockManagerSelect,
      });

      await expect(service.incoming(messageDto)).rejects.toThrow(
        'Unknown contact',
      );
    });
  });
});
