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
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Game } from '@hockey-team-scheduler/shared-domain';
import { ApiKeyGuard } from '../auth/api-key.guard';
import {
  EvaluateScheduleRiskRequestDto,
  EvaluateScheduleRiskResponseDto,
} from '../types';
import { ScheduleRiskService } from './schedule-risk.service';

@ApiTags('schedule-risk')
// Every controller carries its own `v1/` prefix — there is no global prefix,
// and the clients' apiUrl already ends in `/v1`.
@Controller('v1/schedule-risk')
export class ScheduleRiskController {
  constructor(private readonly scheduleRiskService: ScheduleRiskService) {}

  /**
   * Evaluates a set of games for scheduling conflicts and risks.
   * Advisory only — the agent advises, the user decides.
   */
  @Post('evaluate')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
    required: true,
  })
  @ApiOperation({
    summary: 'Evaluate schedule risks for a set of games',
    description:
      'Detects hard time conflicts, close starts, and same-day travel risks ' +
      'across the supplied games. Returns each risk with a plain-English ' +
      'explanation and a suggestion. Thresholds are server-owned.',
  })
  @ApiBody({ type: EvaluateScheduleRiskRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Schedule risk evaluation results',
    type: EvaluateScheduleRiskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  evaluateScheduleRisk(
    @Body() dto: EvaluateScheduleRiskRequestDto,
  ): EvaluateScheduleRiskResponseDto {
    if (!Array.isArray(dto?.games)) {
      throw new HttpException(
        'games must be an array',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return this.scheduleRiskService.evaluate(
        dto.games as Game[],
      ) as EvaluateScheduleRiskResponseDto;
    } catch (error) {
      console.error('Error evaluating schedule risks:', error);
      throw new HttpException(
        error.message || 'Failed to evaluate schedule risks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
