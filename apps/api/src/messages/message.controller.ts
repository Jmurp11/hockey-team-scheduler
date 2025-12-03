import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiExcludeController,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateConversationDto, MessageDto } from '../types';

// @ApiExcludeController()
@ApiTags('Messages')
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
  async incoming(@Body() incomingMessage: MessageDto) {
    return this.messageService.incoming(incomingMessage);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') conversationId: string, @Req() req: any) {
    return this.messageService.getMessages(conversationId, req.user.id);
  }
}
