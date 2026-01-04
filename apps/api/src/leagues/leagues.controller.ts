import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { League } from '../types';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Leagues')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/leagues')
export class LeagueController {
  constructor(private readonly leagueService: LeaguesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leagues' })
  @ApiResponse({ status: 200, description: 'List of all leagues', type: [League] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLeagues(): Promise<League[]> {
    try {
      return await this.leagueService.getLeagues();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch leagues',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':abbreviation')
  @ApiOperation({ summary: 'Get a league by abbreviation' })
  @ApiParam({
    name: 'abbreviation',
    description: 'League abbreviation',
    example: 'NHL',
  })
  @ApiResponse({ status: 200, description: 'League details', type: League })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'League not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLeague(@Param('abbreviation') abbreviation: string): Promise<League> {
    try {
      const league = await this.leagueService.getLeague(abbreviation);
      if (!league) {
        throw new HttpException('League not found', HttpStatus.NOT_FOUND);
      }
      return league;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to fetch league',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
