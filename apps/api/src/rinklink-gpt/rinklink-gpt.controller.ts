import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExcludeController,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RinkLinkGptService } from './rinklink-gpt.service';
import { ChatRequestDto, ChatResponseDto } from './rinklink-gpt.types';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('RinkLinkGPT')
@ApiExcludeController()
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/rinklink-gpt')
export class RinkLinkGptController {
  constructor(private readonly rinkLinkGptService: RinkLinkGptService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with RinkLinkGPT',
    description: `Send a message to the RinkLinkGPT AI assistant. The assistant can help with:
    - Viewing your game schedule
    - Finding opponents for games
    - Discovering tournaments
    - Adding games to your schedule (with confirmation)
    - Registering for tournaments (with confirmation)
    - Finding nearby restaurants and hotels

    For write operations (creating games, registering for tournaments), the assistant will ask for confirmation before proceeding.`,
  })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Chat response from RinkLinkGPT',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      return await this.rinkLinkGptService.chat(chatRequest);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process chat request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
