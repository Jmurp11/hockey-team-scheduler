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

import { OpenAiService } from './open-ai.service';
import { ContactSchedulerDto } from './open-ai.types';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('AI Services')
@ApiExcludeController()
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/ai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('contact-scheduler')
  @ApiOperation({
    summary: 'Get contact information for hockey teams',
    description: 'Uses AI to find and return contact information for team schedulers',
  })
  @ApiBody({ type: ContactSchedulerDto })
  @ApiResponse({ status: 200, description: 'Contact information retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async contactScheduler(@Body() contactSchedulerDto: ContactSchedulerDto) {
    try {
      return await this.openAiService.contactScheduler(contactSchedulerDto);
    } catch (error) {
      throw new HttpException(
        'Failed to process contact scheduler request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
