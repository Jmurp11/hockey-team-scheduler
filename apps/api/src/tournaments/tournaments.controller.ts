import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TournamentsService } from './tournaments.service';
import { Tournament, TournamentProps } from '../types';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Tournaments')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key needed to access the endpoints',
  required: true,
})
@Controller('v1/tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiResponse({
    status: 200,
    description: 'List of all tournaments',
    type: [Tournament],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTournaments(): Promise<Tournament[]> {
    try {
      return await this.tournamentsService.getTournaments();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch tournaments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('nearbyTournaments')
  @ApiOperation({
    summary: 'Get nearby tournaments',
    description: 'Returns tournaments near the specified association',
  })
  @ApiResponse({
    status: 200,
    description: 'List of nearby tournaments',
    type: [Tournament],
  })
  @ApiResponse({ status: 400, description: 'Bad request - Missing association ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'No tournaments found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getNearbyTournaments(
    @Query() queryParams: TournamentProps,
  ): Promise<Partial<Tournament>[]> {
    if (!queryParams.p_id) {
      throw new HttpException(
        'Association ID (p_id) is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tournaments = await this.tournamentsService.getNearbyTournaments({
        p_id: queryParams.p_id,
      });

      if (!tournaments || tournaments.length === 0) {
        throw new HttpException(
          'No nearby tournaments found',
          HttpStatus.NOT_FOUND,
        );
      }

      return tournaments;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch nearby tournaments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tournament by ID' })
  @ApiParam({
    name: 'id',
    description: 'Tournament ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Tournament details',
    type: Tournament,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTournament(@Param('id') id: string): Promise<Tournament> {
    try {
      const tournament = await this.tournamentsService.getTournament(id);

      if (!tournament) {
        throw new HttpException('Tournament not found', HttpStatus.NOT_FOUND);
      }

      return tournament;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch tournament',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
