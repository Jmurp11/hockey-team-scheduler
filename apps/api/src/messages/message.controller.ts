import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateConversationDto, MessageDto } from '../types';

import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Messages')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('conversations')
  @ApiOperation({
    summary: 'Start a conversation',
    description: 'Initiate a new conversation with a team manager',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 201, description: 'Conversation started successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async startConversation(@Body() conversationInfo: CreateConversationDto) {
    try {
      return await this.messageService.sendInitialMessage(conversationInfo);
    } catch (error) {
      throw new HttpException(
        'Failed to start conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('incoming')
  @ApiOperation({
    summary: 'Handle incoming message',
    description: 'Process incoming messages from other team managers',
  })
  @ApiBody({ type: MessageDto })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid message data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async incoming(@Body() incomingMessage: MessageDto) {
    try {
      return await this.messageService.incoming(incomingMessage);
    } catch (error) {
      throw new HttpException(
        'Failed to process incoming message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for a user' })
  @ApiQuery({ name: 'userId', description: 'User ID', required: true })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing userId' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getConversations(@Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.messageService.getConversations(userId);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'userId', description: 'User ID', required: true })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing userId' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const messages = await this.messageService.getMessages(conversationId, userId);
      if (!messages) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      return messages;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch messages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
