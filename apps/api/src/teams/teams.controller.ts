import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  NearbyTeamsParams,
  NearbyTeamsQueryDto,
  Team,
  TeamsQueryDto,
} from '../types';

import { TeamsService } from './teams.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('teams')
@UseGuards(ApiKeyGuard)
@Controller('v1/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('team/:id')
  @ApiResponse({
    status: 200,
    description: 'Get a team by ID.',
    type: Team,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  @ApiParam({ name: 'id', required: true, description: 'The ID of the team' })
  async getTeam(@Param('id') id: number): Promise<Team | null> {
    return this.teamsService.getTeam(id);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all teams',
    type: [Team],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async getTeams(@Query() query: TeamsQueryDto): Promise<Team[]> {
    return this.teamsService.getTeams(query);
  }

  @Get('nearbyTeams')
  @ApiResponse({
    status: 200,
    description: 'Get a nearby teams by association.',
    type: Team,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key needed to access the endpoints',
  })
  async getNearbyTeams(
    @Query() queryParams: NearbyTeamsQueryDto,
  ): Promise<Partial<Team>[] | null> {
    const params: NearbyTeamsParams = {
      p_id: queryParams.p_id,
      p_girls_only: queryParams.p_girls_only,
      p_age: queryParams.p_age,
      p_max_rating: queryParams.p_max_rating,
      p_min_rating: queryParams.p_min_rating,
      p_max_distance: queryParams.p_max_distance,
    };
    return this.teamsService.getNearbyTeams(params);
  }
}
