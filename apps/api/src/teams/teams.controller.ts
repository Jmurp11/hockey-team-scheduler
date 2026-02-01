import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  NearbyTeamsParams,
  NearbyTeamsQueryDto,
  Team,
  TeamsQueryDto,
} from '../types';
import { FindMatchesDto } from '../game-matching/find-matches.dto';

import { TeamsService } from './teams.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Teams')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams', description: 'Retrieve teams with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of teams', type: [Team] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTeams(@Query() query: TeamsQueryDto): Promise<Team[]> {
    try {
      return await this.teamsService.getTeams(query);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch teams',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('nearbyTeams')
  @ApiOperation({
    summary: 'Get nearby teams',
    description: 'Find teams near a specified association with filtering options',
  })
  @ApiResponse({ status: 200, description: 'List of nearby teams', type: [Team] })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'No teams found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getNearbyTeams(
    @Query() queryParams: NearbyTeamsQueryDto,
  ): Promise<Partial<Team>[]> {
    if (!queryParams.p_id) {
      throw new HttpException(
        'Association ID (p_id) is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const params: NearbyTeamsParams = {
        p_id: queryParams.p_id,
        p_girls_only: queryParams.p_girls_only,
        p_age: queryParams.p_age,
        p_max_rating: queryParams.p_max_rating,
        p_min_rating: queryParams.p_min_rating,
        p_max_distance: queryParams.p_max_distance,
      };

      const teams = await this.teamsService.getNearbyTeams(params);

      if (!teams || teams.length === 0) {
        throw new HttpException('No nearby teams found', HttpStatus.NOT_FOUND);
      }

      return teams;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch nearby teams',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('find-matches')
  @ApiOperation({
    summary: 'Find and rank potential opponents',
    description:
      'Searches for nearby teams with similar ratings, scores and ranks them, and looks up manager contact info.',
  })
  @ApiBody({ type: FindMatchesDto })
  @ApiResponse({ status: 201, description: 'Match results returned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findMatches(@Body() dto: FindMatchesDto) {
    if (!dto.userId || !dto.startDate || !dto.endDate) {
      throw new HttpException(
        'userId, startDate, and endDate are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.teamsService.findGameMatches(dto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to find matches',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID', type: Number })
  @ApiResponse({ status: 200, description: 'Team details', type: Team })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTeam(@Param('id') id: number): Promise<Team> {
    try {
      const team = await this.teamsService.getTeam(id);
      if (!team) {
        throw new HttpException('Team not found', HttpStatus.NOT_FOUND);
      }
      return team;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch team',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
