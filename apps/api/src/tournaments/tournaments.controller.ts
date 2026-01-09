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

import { TournamentsService } from './tournaments.service';
import { Tournament, TournamentProps } from '../types';
import { ApiKeyGuard } from '../auth/api-key.guard';
import {
  CreateFeaturedCheckoutDto,
  CreateTournamentDto,
  VerifyPaymentDto,
} from './create-tournament.dto';

/**
 * Response type for Stripe checkout session creation
 */
class CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

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

  /**
   * Get all public tournaments for display.
   * Featured tournaments are returned first, then sorted by date.
   */
  @Get('public')
  @ApiOperation({
    summary: 'Get all public tournaments',
    description:
      'Returns all upcoming tournaments for public display. Featured tournaments appear first.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of public tournaments sorted by featured status and date',
    type: [Tournament],
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPublicTournaments(): Promise<Tournament[]> {
    try {
      return await this.tournamentsService.getPublicTournaments();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch public tournaments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Creates a Stripe Checkout Session for a featured tournament listing.
   * Returns the checkout URL for redirecting the user.
   */
  @Post('featured/checkout')
  @ApiOperation({
    summary: 'Create Stripe checkout for featured tournament',
    description:
      'Creates a Stripe Checkout Session for purchasing a featured tournament listing ($99). Returns the checkout URL.',
  })
  @ApiBody({ type: CreateFeaturedCheckoutDto })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    type: CheckoutSessionResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error - Stripe not configured' })
  async createFeaturedCheckout(
    @Body() dto: CreateFeaturedCheckoutDto,
  ): Promise<CheckoutSessionResponse> {
    try {
      return await this.tournamentsService.createFeaturedCheckoutSession(
        dto.tournament,
        dto.successUrl,
        dto.cancelUrl,
      );
    } catch (error) {
      if (error.message === 'Stripe is not configured') {
        throw new HttpException(
          'Payment processing is not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        error.message || 'Failed to create checkout session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifies a Stripe payment and creates the featured tournament.
   * Called after successful Stripe checkout redirect.
   */
  @Post('featured/verify-payment')
  @ApiOperation({
    summary: 'Verify payment and create featured tournament',
    description:
      'Verifies the Stripe checkout session payment and creates the featured tournament listing.',
  })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Featured tournament created successfully',
    type: Tournament,
  })
  @ApiResponse({
    status: 400,
    description: 'Payment not verified or session invalid',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async verifyPaymentAndCreateTournament(
    @Body() dto: VerifyPaymentDto,
  ): Promise<Tournament> {
    try {
      const tournament = await this.tournamentsService.createFeaturedTournamentFromSession(
        dto.sessionId,
      );

      if (!tournament) {
        throw new HttpException(
          'Payment not verified or session invalid',
          HttpStatus.BAD_REQUEST,
        );
      }

      return tournament;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to verify payment and create tournament',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

  /**
   * Creates a new tournament submission from tournament directors.
   * Supports both free listings and paid featured tournaments.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new tournament',
    description:
      'Submit a new tournament listing. Set featured=true for paid featured listings.',
  })
  @ApiBody({ type: CreateTournamentDto })
  @ApiResponse({
    status: 201,
    description: 'Tournament created successfully',
    type: Tournament,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Tournament with same name and start date already exists',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createTournament(
    @Body() createTournamentDto: CreateTournamentDto,
  ): Promise<Tournament> {
    try {
      return await this.tournamentsService.createTournament(createTournamentDto);
    } catch (error) {
      // Handle duplicate tournament error (unique constraint violation)
      if (error.message?.includes('duplicate') || error.code === '23505') {
        throw new HttpException(
          'A tournament with this name and start date already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        error.message || 'Failed to create tournament',
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
