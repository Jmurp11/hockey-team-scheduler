import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { League } from '../types';
import {
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('leagues')
@Controller('v1/leagues')
export class LeagueController {
  constructor(private readonly leagueService: LeaguesService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'All records have been successfully returned.',
    type: [League],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async getLeagues(): Promise<League[]> {
    return this.leagueService.getLeagues();
  }

  @Get(':abbreviation')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully returned.',
    type: League,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiParam({
    name: 'abbreviation',
    required: true,
    description: 'The abbreviation of the league',
    example: 'NHL',
  })
  async getLeague(
    @Param('abbreviation') abbreviation: string,
  ): Promise<League | null> {
    return this.leagueService.getLeague(abbreviation);
  }
}
