import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { DashboardService, DashboardSummary } from './dashboard.service';

@ApiTags('dashboard')
@UseGuards(ApiKeyGuard)
@Controller('v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary for a team' })
  @ApiQuery({
    name: 'teamId',
    required: true,
    description: 'The team ID to get dashboard summary for',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary data',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid team ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found',
  })
  async getDashboardSummary(
    @Query('teamId') teamId: string,
  ): Promise<DashboardSummary | null> {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }

    const teamIdNum = parseInt(teamId, 10);
    if (isNaN(teamIdNum)) {
      throw new BadRequestException('teamId must be a valid number');
    }

    return this.dashboardService.getDashboardSummary(teamIdNum);
  }
}
