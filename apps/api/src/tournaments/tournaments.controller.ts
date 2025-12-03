import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { Tournament, TournamentProps } from '../types';

@ApiTags('tournaments')
@Controller('v1/tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all tournaments.',
  })
  async getTournaments() {
    return this.tournamentsService.getTournaments();
  }

  @Get('nearByTournaments')
  @ApiResponse({
    status: 200,
    description: 'Get a nearby teams by association.',
    type: Tournament,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async getNearbyTeams(
    @Query() queryParams: TournamentProps,
  ): Promise<Partial<Tournament>[] | null> {
    const params: TournamentProps = {
      p_id: queryParams.p_id,
    };
    return this.tournamentsService.getNearbyTournaments(params);
  }
}
