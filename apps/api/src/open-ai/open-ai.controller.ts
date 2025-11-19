import { Body, Controller, Post } from '@nestjs/common';
import {
    ApiExcludeController,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { OpenAiService } from './open-ai.service';
import { ContactSchedulerDto, FindTournamentsDto } from './open-ai.types';

@ApiExcludeController()
@ApiTags('Messages')
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
  async contactScheduler(@Body() contactSchedulerDto: ContactSchedulerDto) {
    return this.openAiService.contactScheduler(contactSchedulerDto);
  }
}
