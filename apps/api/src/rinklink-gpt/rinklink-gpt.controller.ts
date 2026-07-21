import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeController,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SupervisorService } from './supervisor/supervisor.service';
import { ChatRequestDto, ChatResponseDto } from './rinklink-gpt.types';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentAuthUser } from '../auth/current-user.decorator';

@ApiTags('RinkLinkGPT')
@ApiExcludeController()
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
@Controller('v1/rinklink-gpt')
export class RinkLinkGptController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Post('chat')
  // Stricter limit than the global default — chat fans out to multiple paid
  // LLM/agent calls, so it is the most cost-sensitive and abuse-prone route.
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  // ChatRequestDto is fully class-validator-decorated, so strict whitelisting
  // is safe here: unknown top-level fields are rejected.
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
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
  async chat(
    @CurrentAuthUser() authUserId: string,
    @Body() chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    try {
      // Identity always comes from the verified token — never trust body.userId.
      chatRequest.userId = authUserId;
      return await this.supervisorService.chat(chatRequest);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process chat request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
