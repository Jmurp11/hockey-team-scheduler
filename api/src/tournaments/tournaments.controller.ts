import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';

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

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Tournament ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Get a tournament by ID.',
  })
  async getTournament(@Param('id') id: string) {
    return this.tournamentsService.getTournament(id);
  }
}
