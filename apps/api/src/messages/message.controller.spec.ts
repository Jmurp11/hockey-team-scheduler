import { Test, TestingModule } from '@nestjs/testing';
import { CreateConversationDto, MessageDto } from '../types';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

describe('MessageController', () => {
  let controller: MessageController;

  const mockMessageService = {
    sendInitialMessage: jest.fn(),
    incoming: jest.fn(),
    getMessages: jest.fn(),
  };

  const mockConversation = {
    id: '1',
    user_id: 'user-1',
    manager_id: 'manager-1',
    ai_enabled: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessageService,
          useValue: mockMessageService,
        },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startConversation', () => {
    it('should start a conversation successfully', async () => {
      const conversationDto: CreateConversationDto = {
        userId: 'user-1',
        contactName: 'John Doe',
        contactTeam: 'Test Team',
        message: 'Hello, would like to schedule a game',
        phone: '+1234567890',
      };

      mockMessageService.sendInitialMessage.mockResolvedValue(mockConversation);

      const result = await controller.startConversation(conversationDto);

      expect(mockMessageService.sendInitialMessage).toHaveBeenCalledWith(
        conversationDto,
      );
      expect(result).toEqual(mockConversation);
    });

    it('should handle errors when starting conversation', async () => {
      const conversationDto: CreateConversationDto = {
        userId: 'user-1',
        contactName: 'John Doe',
        contactTeam: 'Test Team',
        message: 'Hello',
        phone: '+1234567890',
      };

      mockMessageService.sendInitialMessage.mockRejectedValue(
        new Error('Failed to start conversation'),
      );

      await expect(
        controller.startConversation(conversationDto),
      ).rejects.toThrow('Failed to start conversation');
    });
  });

  describe('incoming', () => {
    it('should handle incoming message successfully', async () => {
      const incomingMessage: MessageDto = {
        phone: '+1234567890',
        body: 'Yes, that works for us',
      };

      mockMessageService.incoming.mockResolvedValue(undefined);

      await controller.incoming(incomingMessage);

      expect(mockMessageService.incoming).toHaveBeenCalledWith(incomingMessage);
    });

    it('should handle errors with incoming messages', async () => {
      const incomingMessage: MessageDto = {
        phone: '+1234567890',
        body: 'Test message',
      };

      mockMessageService.incoming.mockRejectedValue(
        new Error('Unknown contact'),
      );

      await expect(controller.incoming(incomingMessage)).rejects.toThrow(
        'Unknown contact',
      );
    });
  });

  describe('getMessages', () => {
    it('should get messages for a conversation', async () => {
      const conversationId = 'conv-1';
      const userId = 'user-1';
      const mockMessages: MessageDto[] = [
        {
          phone: '+1234567890',
          body: 'Hello',
        },
      ];

      mockMessageService.getMessages.mockResolvedValue(mockMessages);

      const req = { user: { id: userId } };
      const result = await controller.getMessages(conversationId, req);

      expect(mockMessageService.getMessages).toHaveBeenCalledWith(
        conversationId,
        userId,
      );
      expect(result).toEqual(mockMessages);
    });

    it('should handle errors when getting messages', async () => {
      const conversationId = 'conv-1';
      const userId = 'user-1';

      mockMessageService.getMessages.mockRejectedValue(
        new Error('Conversation not found'),
      );

      const req = { user: { id: userId } };
      await expect(controller.getMessages(conversationId, req)).rejects.toThrow(
        'Conversation not found',
      );
    });
  });
});
