import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExcludeController,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateConversationDto, MessageDto } from '../types';

import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiExcludeController()
@ApiTags('Messages')
@UseGuards(ApiKeyGuard)
@Controller('v1/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('start-conversation')
  @ApiOperation({ summary: 'Start a conversation with a team manager' })
  @ApiResponse({
    status: 200,
    description: 'Conversation has been started',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async startConversation(@Body() conversationInfo: CreateConversationDto) {
    return this.messageService.sendInitialMessage(conversationInfo);
  }

  @Post('incoming')
  @ApiOperation({ summary: 'incoming messages from other team managers' })
  @ApiResponse({
    status: 200,
    description: 'Message has been routed to the AI Agent',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async incoming(@Body() incomingMessage: MessageDto) {
    return this.messageService.incoming(incomingMessage);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Query('userId') userId: string,
  ) {
    return this.messageService.getMessages(conversationId, userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async getConversations(@Query('userId') userId: string) {
    return this.messageService.getConversations(userId);
  }
}
