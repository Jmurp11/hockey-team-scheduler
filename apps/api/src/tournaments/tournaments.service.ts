import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { supabase } from '../supabase';
import {
  Tournament,
  TournamentProps,
  EvaluateTournamentFitRequestDto,
  EvaluateTournamentFitResponseDto,
  TournamentWithFitDto,
  TournamentFitEvaluationDto,
} from '../types';
import { CreateTournamentDto } from './create-tournament.dto';

/**
 * Featured tournament listing price in cents ($99.00)
 */
const FEATURED_TOURNAMENT_PRICE_CENTS = 9900;

/**
 * Tournament Fit configuration
 */
const FIT_CONFIG = {
  maxGoodFitDistance: 100,
  maxReasonableDistance: 300,
  ratingMatchThreshold: 2,
  ratingAcceptableThreshold: 4,
  scheduleBufferDays: 3,
  maxGamesForGoodFit: 1,
  // Score weights for overall calculation
  weights: {
    ratingFit: 0.25,
    scheduleAvailability: 0.35,
    travelScore: 0.25,
    scheduleDensity: 0.15,
  },
} as const;

/**
 * Level to rating range mapping
 */
const LEVEL_RATING_MAP: Record<string, { min: number; max: number }> = {
  'B': { min: 60, max: 73 },
  'A': { min: 73, max: 81 },
  'AA': { min: 81, max: 90 },
  'AAA': { min: 88, max: 100 },
  'Tier 1': { min: 90, max: 100 },
  'Tier 2': { min: 83, max: 89 },
  'Tier 3': { min: 60, max: 83 },
} as const;

/**
 * Age-group compatibility map.
 * Maps each team age group to the tournament age groups it may enter.
 */
const AGE_COMPATIBILITY_MAP: Record<string, string[]> = {
  '8U':  ['8U'],
  '9U':  ['9U', '10U'],
  '10U': ['10U'],
  '11U': ['11U', '12U'],
  '12U': ['12U'],
  '13U': ['13U', '14U'],
  '14U': ['14U'],
  '15U': ['15U', '16U'],
  '16U': ['16U'],
  '18U': ['18U'],
};

/**
 * Checks whether a tournament is age-compatible with a team.
 * Returns true if the tournament has no age restriction or lists
 * at least one age group the team is eligible for.
 */
function isTournamentAgeCompatible(
  teamAge: string,
  tournamentAges: string[] | null | undefined,
): boolean {
  if (!tournamentAges || tournamentAges.length === 0) {
    return true;
  }

  const normalized = teamAge.trim().toUpperCase();
  const compatible = AGE_COMPATIBILITY_MAP[normalized];
  if (!compatible) {
    return true; // Unknown team age — don't filter
  }

  const compatibleSet = new Set(compatible);
  const flatAges = (tournamentAges as unknown as string[]).flat().filter(Boolean);
  return flatAges.some((age) => compatibleSet.has(age.trim().toUpperCase()));
}

type TournamentFitLabel = 'Good Fit' | 'Tight Schedule' | 'Travel Heavy';

/**
 * Internal types for tournament fit evaluation
 */
interface TournamentFitData {
  teamRating: number;
  teamAge: string;
  tournaments: TournamentWithDistance[];
  existingGames: Date[];
}

interface TournamentWithDistance extends Partial<Tournament> {
  distance?: number;
  featured?: boolean;
}

interface FitScores {
  ratingFit: number;
  scheduleAvailability: number;
  travelScore: number;
  scheduleDensity: number;
}

interface ScheduleAnalysis {
  score: number;
  hasConflict: boolean;
  conflictingGames: number;
}

interface DensityAnalysis {
  score: number;
  gamesNearby: number;
}

@Injectable()
export class TournamentsService {
  private stripe: Stripe;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey);
    }
  }

  /**
   * Creates a Stripe Checkout Session for a featured tournament listing.
   * Stores pending tournament data in metadata for later retrieval.
   */
  async createFeaturedCheckoutSession(
    dto: CreateTournamentDto,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Featured Tournament Listing',
              description: `Featured listing for "${dto.name}" tournament with priority placement, badge, and promotional benefits.`,
            },
            unit_amount: FEATURED_TOURNAMENT_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        tournamentName: dto.name,
        tournamentEmail: dto.email,
        tournamentLocation: dto.location,
        tournamentStartDate: dto.startDate,
        tournamentEndDate: dto.endDate,
        tournamentAge: JSON.stringify(dto.age || []),
        tournamentLevel: JSON.stringify(dto.level || []),
        tournamentRink: dto.rink || '',
        tournamentRegistrationUrl: dto.registrationUrl || '',
        tournamentDescription: dto.description || '',
        type: 'featured_tournament',
      },
      customer_email: dto.email,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  /**
   * Retrieves a Stripe Checkout Session by ID.
   * Used to verify payment and extract tournament metadata.
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return null;
    }
  }

  /**
   * Creates a featured tournament from a completed checkout session.
   * Extracts tournament data from session metadata.
   */
  async createFeaturedTournamentFromSession(sessionId: string): Promise<Tournament | null> {
    const session = await this.getCheckoutSession(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return null;
    }

    const metadata = session.metadata;
    if (!metadata || metadata.type !== 'featured_tournament') {
      return null;
    }

    // Check if tournament was already created for this session
    const { data: existing } = await supabase
      .from('tournaments')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existing) {
      // Already created, return the existing tournament
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', existing.id)
        .single();
      return data;
    }

    // Create the tournament with featured = true
    const tournamentDto: CreateTournamentDto = {
      name: metadata.tournamentName,
      email: metadata.tournamentEmail,
      location: metadata.tournamentLocation,
      startDate: metadata.tournamentStartDate,
      endDate: metadata.tournamentEndDate,
      age: JSON.parse(metadata.tournamentAge || '[]'),
      level: JSON.parse(metadata.tournamentLevel || '[]'),
      rink: metadata.tournamentRink || undefined,
      registrationUrl: metadata.tournamentRegistrationUrl || undefined,
      description: metadata.tournamentDescription || undefined,
      featured: true,
    };

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentDto.name,
        email: tournamentDto.email,
        location: tournamentDto.location,
        startDate: tournamentDto.startDate,
        endDate: tournamentDto.endDate,
        age: tournamentDto.age || null,
        level: tournamentDto.level || null,
        registrationUrl: tournamentDto.registrationUrl || null,
        rink: tournamentDto.rink || null,
        description: tournamentDto.description || null,
        featured: true,
        stripe_session_id: sessionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating featured tournament from session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Updates a tournament's featured status.
   */
  async updateTournamentFeatured(id: string, featured: boolean): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .update({ featured })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tournament featured status:', error);
      return null;
    }

    return data;
  }
  /**
   * Retrieves all tournaments, sorted with featured tournaments first,
   * then by start date ascending.
   */
  async getTournaments(): Promise<Tournament[]> {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('featured', { ascending: false, nullsFirst: false })
      .order('startDate', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw new Error('Failed to fetch tournaments');
    }

    return tournaments || [];
  }

  /**
   * Retrieves all public/approved tournaments for the public listing page.
   * Featured tournaments appear first, then sorted by start date.
   */
  async getPublicTournaments(): Promise<Tournament[]> {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .gte('endDate', new Date().toISOString().split('T')[0]) // Only future tournaments
      .order('featured', { ascending: false, nullsFirst: false })
      .order('startDate', { ascending: true });

    if (error) {
      console.error('Error fetching public tournaments:', error);
      throw new Error('Failed to fetch public tournaments');
    }

    return tournaments || [];
  }

  async getTournament(id: string) {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching tournament:', error);
      throw new Error('Failed to fetch tournament');
    }

    return tournament;
  }

  /**
   * Retrieves tournaments near a specific association.
   * Enriches the RPC result with the featured status from the tournaments table.
   */
  async getNearbyTournaments(
    params: TournamentProps,
  ): Promise<Partial<Tournament>[]> {
    return this.fetchNearbyTournamentsWithFeatured(params.p_id);
  }

  /**
   * Creates a new tournament in the database.
   * Maps DTO fields to database column names (camelCase to snake_case where needed).
   */
  async createTournament(dto: CreateTournamentDto): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: dto.name,
        email: dto.email,
        location: dto.location,
        startDate: dto.startDate,
        endDate: dto.endDate,
        age: dto.age || null,
        level: dto.level || null,
        registrationUrl: dto.registrationUrl || null,
        rink: dto.rink || null,
        description: dto.description || null,
        featured: dto.featured,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }

    return data;
  }

  /**
   * Evaluates tournament fit for a team based on their rating, schedule, and location.
   * Returns tournaments sorted by fit score with recommendations highlighted.
   */
  async evaluateTournamentFit(
    dto: EvaluateTournamentFitRequestDto,
  ): Promise<EvaluateTournamentFitResponseDto> {
    // Fetch all required data in a single parallel call
    const fitData = await this.fetchTournamentFitData(dto);

    if (fitData.tournaments.length === 0) {
      return { tournaments: [], recommended: [] };
    }

    // Filter to specific tournaments if IDs provided
    const tournamentsToEvaluate = this.filterTournamentsByIds(
      fitData.tournaments,
      dto.tournamentIds,
    );

    // Filter out tournaments incompatible with the team's age group
    const ageCompatible = fitData.teamAge
      ? tournamentsToEvaluate.filter((t) =>
          isTournamentAgeCompatible(fitData.teamAge, t.age as string[] | null),
        )
      : tournamentsToEvaluate;

    // Evaluate each tournament
    const tournamentsWithFit = ageCompatible.map((tournament) =>
      this.buildTournamentWithFit(tournament, fitData.teamRating, fitData.existingGames),
    );

    // Sort and extract recommendations
    const sortedTournaments = this.sortTournamentsByFit(tournamentsWithFit);
    const recommended = this.getRecommendedTournaments(sortedTournaments);

    return { tournaments: sortedTournaments, recommended };
  }

  /**
   * Fetches all data needed for tournament fit evaluation in parallel.
   * Combines team rating, nearby tournaments with featured status, and user schedule.
   */
  private async fetchTournamentFitData(
    dto: EvaluateTournamentFitRequestDto,
  ): Promise<TournamentFitData> {
    // Execute all queries in parallel for optimal performance
    const [teamResult, tournamentsWithFeatured, gamesResult] = await Promise.all([
      // Get team rating and age
      supabase
        .from('rankingswithassoc')
        .select('rating, age')
        .eq('id', dto.teamId)
        .single(),

      // Get nearby tournaments with featured status in one joined query
      this.fetchNearbyTournamentsWithFeatured(dto.associationId),

      // Get user's existing schedule
      supabase
        .from('gamesfull')
        .select('date')
        .eq('user', dto.userId),
    ]);

    // Handle team rating error
    if (teamResult.error) {
      console.error('Error fetching team rating:', teamResult.error);
      throw new Error('Failed to fetch team data');
    }

    // Log games error but continue (schedule scores will be neutral)
    if (gamesResult.error) {
      console.error('Error fetching user schedule:', gamesResult.error);
    }

    return {
      teamRating: teamResult.data?.rating || 0,
      teamAge: teamResult.data?.age || '',
      tournaments: tournamentsWithFeatured,
      existingGames: this.parseGameDates(gamesResult.data || []),
    };
  }

  /**
   * Fetches nearby tournaments using the geospatial RPC.
   * The RPC returns tournament data including featured status and distance.
   */
  private async fetchNearbyTournamentsWithFeatured(
    associationId: number,
  ): Promise<TournamentWithDistance[]> {
    const { data, error } = await supabase.rpc('p_nearby_tournaments', {
      p_id: associationId,
    });

    if (error) {
      console.error('Error fetching nearby tournaments:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Parses game dates from database records into Date objects.
   */
  private parseGameDates(games: { date: string }[]): Date[] {
    return games
      .map((g) => new Date(g.date))
      .filter((d) => !isNaN(d.getTime()));
  }

  /**
   * Filters tournaments to specific IDs if provided.
   */
  private filterTournamentsByIds(
    tournaments: TournamentWithDistance[],
    tournamentIds?: string[],
  ): TournamentWithDistance[] {
    if (!tournamentIds || tournamentIds.length === 0) {
      return tournaments;
    }
    return tournaments.filter((t) => tournamentIds.includes(t.id as string));
  }

  /**
   * Builds a complete TournamentWithFitDto from tournament data.
   */
  private buildTournamentWithFit(
    tournament: TournamentWithDistance,
    teamRating: number,
    existingGames: Date[],
  ): TournamentWithFitDto {
    const tournamentStart = new Date(tournament.startDate as string);
    const tournamentEnd = new Date(tournament.endDate as string);
    const levels = this.normalizeLevels(tournament.level);

    const fit = this.calculateTournamentFit(
      tournament.id as string,
      tournamentStart,
      tournamentEnd,
      levels,
      tournament.distance,
      teamRating,
      existingGames,
    );

    return {
      id: tournament.id as string,
      name: tournament.name as string,
      location: tournament.location as string,
      startDate: tournament.startDate as string,
      endDate: tournament.endDate as string,
      registrationUrl: tournament.registrationUrl as string,
      description: tournament.description as string,
      rink: tournament.rink as string | null,
      age: tournament.age as string[] | null,
      level: tournament.level as string[] | null,
      distance: tournament.distance,
      featured: tournament.featured ?? false,
      fit,
    };
  }

  /**
   * Normalizes tournament levels, flattening nested arrays if necessary.
   */
  private normalizeLevels(levels: string[] | null | undefined): string[] | null {
    if (!levels) return null;
    if (Array.isArray(levels) && levels.length > 0 && Array.isArray(levels[0])) {
      return (levels as unknown as string[][]).flat();
    }
    return levels;
  }

  // ========================================================================
  // FIT CALCULATION METHODS
  // ========================================================================

  /**
   * Calculates complete tournament fit evaluation by aggregating all scores.
   */
  private calculateTournamentFit(
    tournamentId: string,
    tournamentStart: Date,
    tournamentEnd: Date,
    tournamentLevels: string[] | null,
    distanceMiles: number | undefined,
    teamRating: number,
    existingGames: Date[],
  ): TournamentFitEvaluationDto {
    // Calculate individual dimension scores
    const ratingFit = this.scoreRatingFit(teamRating, tournamentLevels);
    const scheduleAnalysis = this.analyzeScheduleAvailability(tournamentStart, tournamentEnd, existingGames);
    const densityAnalysis = this.analyzeScheduleDensity(tournamentStart, tournamentEnd, existingGames);
    const travelScore = this.scoreTravelDistance(distanceMiles);

    const scores: FitScores = {
      ratingFit,
      scheduleAvailability: scheduleAnalysis.score,
      travelScore,
      scheduleDensity: densityAnalysis.score,
    };

    const overallScore = this.computeOverallScore(scores);
    const fitLabel = this.determineFitLabel(scores, scheduleAnalysis.hasConflict, overallScore);
    const explanation = this.generateExplanation(
      fitLabel,
      scores,
      scheduleAnalysis.hasConflict,
      densityAnalysis.gamesNearby,
      tournamentStart,
    );

    return {
      tournamentId,
      fitLabel,
      explanation,
      scores,
      overallScore,
      hasScheduleConflict: scheduleAnalysis.hasConflict,
      gamesNearby: densityAnalysis.gamesNearby,
    };
  }

  // ========================================================================
  // RATING FIT SCORING
  // ========================================================================

  /**
   * Scores how well the tournament level matches the team's rating (0-100).
   */
  private scoreRatingFit(teamRating: number, tournamentLevels: string[] | null): number {
    if (!tournamentLevels || tournamentLevels.length === 0) {
      return 70; // No level specified - neutral score
    }

    const validLevels = tournamentLevels.flat().filter(Boolean);
    const bestScore = Math.max(...validLevels.map((level) => this.scoreLevelMatch(teamRating, level)));

    return this.clampScore(bestScore);
  }

  /**
   * Scores a single level match against the team rating.
   */
  private scoreLevelMatch(teamRating: number, level: string): number {
    const range = LEVEL_RATING_MAP[level.trim()];

    if (!range) {
      return 60; // Unknown level - moderate score
    }

    if (this.isRatingInRange(teamRating, range)) {
      return this.scoreWithinRange(teamRating, range);
    }

    return this.scoreOutsideRange(teamRating, range);
  }

  /**
   * Checks if a rating falls within a level's range.
   */
  private isRatingInRange(rating: number, range: { min: number; max: number }): boolean {
    return rating >= range.min && rating <= range.max;
  }

  /**
   * Scores when team rating is within the tournament level range.
   */
  private scoreWithinRange(rating: number, range: { min: number; max: number }): number {
    const center = (range.min + range.max) / 2;
    const maxDiff = (range.max - range.min) / 2;
    const actualDiff = Math.abs(rating - center);
    return 100 - (actualDiff / maxDiff) * 20;
  }

  /**
   * Scores when team rating is outside the tournament level range.
   */
  private scoreOutsideRange(rating: number, range: { min: number; max: number }): number {
    const distance = rating < range.min ? range.min - rating : rating - range.max;

    if (distance <= FIT_CONFIG.ratingMatchThreshold) {
      return 70 - (distance / FIT_CONFIG.ratingMatchThreshold) * 20;
    }

    if (distance <= FIT_CONFIG.ratingAcceptableThreshold) {
      const normalizedDist = (distance - FIT_CONFIG.ratingMatchThreshold) / FIT_CONFIG.ratingMatchThreshold;
      return 50 - normalizedDist * 30;
    }

    return Math.max(0, 20 - (distance - FIT_CONFIG.ratingAcceptableThreshold) / 10);
  }

  // ========================================================================
  // SCHEDULE ANALYSIS
  // ========================================================================

  /**
   * Analyzes schedule availability during tournament dates.
   */
  private analyzeScheduleAvailability(
    tournamentStart: Date,
    tournamentEnd: Date,
    existingGames: Date[],
  ): ScheduleAnalysis {
    const conflictingGames = this.countGamesInRange(existingGames, tournamentStart, tournamentEnd);

    return {
      score: this.scoreConflicts(conflictingGames),
      hasConflict: conflictingGames > 0,
      conflictingGames,
    };
  }

  /**
   * Analyzes schedule density around tournament dates.
   */
  private analyzeScheduleDensity(
    tournamentStart: Date,
    tournamentEnd: Date,
    existingGames: Date[],
  ): DensityAnalysis {
    const bufferMs = FIT_CONFIG.scheduleBufferDays * 24 * 60 * 60 * 1000;
    const bufferStart = new Date(tournamentStart.getTime() - bufferMs);
    const bufferEnd = new Date(tournamentEnd.getTime() + bufferMs);

    // Count games in buffer zone but not during tournament
    const gamesNearby = existingGames.filter((gameDate) => {
      const gameTime = gameDate.getTime();
      const isInBuffer = gameTime >= bufferStart.getTime() && gameTime <= bufferEnd.getTime();
      const isDuringTournament = gameTime >= tournamentStart.getTime() && gameTime <= tournamentEnd.getTime();
      return isInBuffer && !isDuringTournament;
    }).length;

    return {
      score: this.scoreDensity(gamesNearby),
      gamesNearby,
    };
  }

  /**
   * Counts games within a date range.
   */
  private countGamesInRange(games: Date[], start: Date, end: Date): number {
    const startTime = start.getTime();
    const endTime = end.getTime();

    return games.filter((gameDate) => {
      const gameTime = gameDate.getTime();
      return gameTime >= startTime && gameTime <= endTime;
    }).length;
  }

  /**
   * Converts conflict count to a score.
   */
  private scoreConflicts(conflictCount: number): number {
    const scoreMap: Record<number, number> = { 0: 100, 1: 60, 2: 30 };
    return scoreMap[conflictCount] ?? 0;
  }

  /**
   * Converts nearby game count to a density score.
   */
  private scoreDensity(gamesNearby: number): number {
    if (gamesNearby <= FIT_CONFIG.maxGamesForGoodFit) {
      return 100;
    }

    if (gamesNearby <= FIT_CONFIG.maxGamesForGoodFit + 2) {
      return 70 - (gamesNearby - FIT_CONFIG.maxGamesForGoodFit) * 15;
    }

    return Math.max(20, 40 - (gamesNearby - FIT_CONFIG.maxGamesForGoodFit - 2) * 10);
  }

  // ========================================================================
  // TRAVEL SCORING
  // ========================================================================

  /**
   * Scores travel distance (0-100).
   */
  private scoreTravelDistance(distanceMiles: number | undefined): number {
    if (distanceMiles === undefined || distanceMiles === null) {
      return 50; // Unknown distance - neutral score
    }

    if (distanceMiles <= FIT_CONFIG.maxGoodFitDistance) {
      return Math.round(100 - (distanceMiles / FIT_CONFIG.maxGoodFitDistance) * 15);
    }

    if (distanceMiles <= FIT_CONFIG.maxReasonableDistance) {
      const extraDistance = distanceMiles - FIT_CONFIG.maxGoodFitDistance;
      const rangeSize = FIT_CONFIG.maxReasonableDistance - FIT_CONFIG.maxGoodFitDistance;
      return Math.round(85 - (extraDistance / rangeSize) * 45);
    }

    const extraDistance = distanceMiles - FIT_CONFIG.maxReasonableDistance;
    return Math.round(Math.max(10, 40 - extraDistance / 50));
  }

  // ========================================================================
  // OVERALL SCORING & LABEL DETERMINATION
  // ========================================================================

  /**
   * Computes weighted overall score from dimension scores.
   */
  private computeOverallScore(scores: FitScores): number {
    const { weights } = FIT_CONFIG;

    return Math.round(
      scores.ratingFit * weights.ratingFit +
      scores.scheduleAvailability * weights.scheduleAvailability +
      scores.travelScore * weights.travelScore +
      scores.scheduleDensity * weights.scheduleDensity,
    );
  }

  /**
   * Determines the fit label based on scores and constraints.
   */
  private determineFitLabel(
    scores: FitScores,
    hasConflict: boolean,
    overallScore: number,
  ): TournamentFitLabel {
    // Schedule issues take priority
    if (hasConflict || scores.scheduleAvailability < 70 || scores.scheduleDensity < 50) {
      return 'Tight Schedule';
    }

    // Travel heavy but otherwise good fit
    if (scores.travelScore < 50 && scores.ratingFit >= 60 && scores.scheduleAvailability >= 80) {
      return 'Travel Heavy';
    }

    // Good overall fit
    if (overallScore >= 65 && scores.ratingFit >= 50) {
      return 'Good Fit';
    }

    // Default to travel heavy if that's the limiting factor
    if (scores.travelScore < 50) {
      return 'Travel Heavy';
    }

    return 'Tight Schedule';
  }

  // ========================================================================
  // EXPLANATION GENERATION
  // ========================================================================

  /**
   * Generates a plain-English explanation of the fit assessment.
   */
  private generateExplanation(
    fitLabel: TournamentFitLabel,
    scores: FitScores,
    hasConflict: boolean,
    gamesNearby: number,
    tournamentStart: Date,
  ): string {
    const month = tournamentStart.toLocaleString('en-US', { month: 'long' });
    const insights = this.gatherInsights(scores, hasConflict, gamesNearby, month);

    return this.formatExplanation(fitLabel, insights, hasConflict, gamesNearby, month);
  }

  /**
   * Gathers insight phrases based on scores.
   */
  private gatherInsights(
    scores: FitScores,
    hasConflict: boolean,
    gamesNearby: number,
    month: string,
  ): string[] {
    const insights: string[] = [];

    // Rating insights
    if (scores.ratingFit >= 80) {
      insights.push('Fits your rating');
    } else if (scores.ratingFit >= 60) {
      insights.push('Competitive match for your level');
    }

    // Schedule insights
    if (hasConflict) {
      insights.push('conflicts with existing games');
    } else if (scores.scheduleAvailability === 100 && scores.scheduleDensity >= 80) {
      insights.push(`fills an open weekend in ${month}`);
    } else if (gamesNearby > 2) {
      insights.push('schedule is busy around these dates');
    }

    // Travel insights
    if (scores.travelScore >= 80) {
      insights.push('nearby location');
    } else if (scores.travelScore < 50) {
      insights.push('requires significant travel');
    }

    return insights;
  }

  /**
   * Formats insights into a complete explanation based on fit label.
   */
  private formatExplanation(
    fitLabel: TournamentFitLabel,
    insights: string[],
    hasConflict: boolean,
    gamesNearby: number,
    month: string,
  ): string {
    switch (fitLabel) {
      case 'Good Fit':
        return this.formatGoodFitExplanation(insights);

      case 'Tight Schedule':
        return this.formatTightScheduleExplanation(insights, hasConflict, gamesNearby, month);

      case 'Travel Heavy':
        return this.formatTravelHeavyExplanation(insights);

      default:
        return 'Unable to determine fit.';
    }
  }

  private formatGoodFitExplanation(insights: string[]): string {
    if (insights.length >= 2) {
      return `${insights[0]} and ${insights[1]}.`;
    }
    return insights[0] ? `${insights[0]}.` : 'Good match for your team.';
  }

  private formatTightScheduleExplanation(
    insights: string[],
    hasConflict: boolean,
    gamesNearby: number,
    month: string,
  ): string {
    if (hasConflict) {
      const conflictInsight = insights.find((e) => e.includes('conflict'));
      return `This tournament ${conflictInsight || 'overlaps with your existing schedule'}.`;
    }

    return gamesNearby > 2
      ? `Your schedule is busy around ${month}. Consider your team's stamina.`
      : 'Schedule may be tight with games close to these dates.';
  }

  private formatTravelHeavyExplanation(insights: string[]): string {
    const hasGoodRating = insights.some((i) => i.includes('rating') || i.includes('level'));
    const baseExplanation = insights.some((i) => i.includes('significant'))
      ? 'Long travel distance'
      : 'Moderate travel required';
    const bonus = hasGoodRating ? ', but good rating match' : '';
    return `${baseExplanation}${bonus}.`;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Clamps a score to the 0-100 range.
   */
  private clampScore(score: number): number {
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Sorts tournaments by fit score (featured first, then by overall score).
   */
  private sortTournamentsByFit(tournaments: TournamentWithFitDto[]): TournamentWithFitDto[] {
    return [...tournaments].sort((a, b) => {
      const aFeatured = a.featured ?? false;
      const bFeatured = b.featured ?? false;
      if (aFeatured !== bFeatured) {
        return bFeatured ? 1 : -1;
      }

      const labelPriority: Record<TournamentFitLabel, number> = {
        'Good Fit': 3,
        'Tight Schedule': 2,
        'Travel Heavy': 1,
      };

      const aLabel = a.fit?.fitLabel;
      const bLabel = b.fit?.fitLabel;

      if (aLabel && bLabel && aLabel !== bLabel) {
        return (labelPriority[bLabel] || 0) - (labelPriority[aLabel] || 0);
      }

      const aScore = a.fit?.overallScore ?? 0;
      const bScore = b.fit?.overallScore ?? 0;
      return bScore - aScore;
    });
  }

  /**
   * Filters tournaments to get recommended ones (Good Fit with high score).
   */
  private getRecommendedTournaments(tournaments: TournamentWithFitDto[]): TournamentWithFitDto[] {
    return tournaments.filter(
      (t) => t.fit?.fitLabel === 'Good Fit' && (t.fit?.overallScore ?? 0) >= 65,
    );
  }
}