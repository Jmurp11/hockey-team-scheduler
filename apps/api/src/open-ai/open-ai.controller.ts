import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiExcludeController,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { OpenAiService } from './open-ai.service';
import { ContactSchedulerDto, FindTournamentsDto } from './open-ai.types';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiExcludeController()
@ApiTags('Messages')
@UseGuards(ApiKeyGuard)
@Controller('v1/open-ai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('contact-scheduler')
  @ApiOperation({ summary: 'Get contact information for hockey teams' })
  @ApiResponse({
    status: 200,
    description: 'Contact information retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async contactScheduler(@Body() contactSchedulerDto: ContactSchedulerDto) {
    return this.openAiService.contactScheduler(contactSchedulerDto);
  }
}
