import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { supabase } from '../supabase';
import { Tournament, TournamentProps } from '../types';
import { CreateTournamentDto } from './create-tournament.dto';

/**
 * Featured tournament listing price in cents ($99.00)
 */
const FEATURED_TOURNAMENT_PRICE_CENTS = 9900;

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
    const { data, error } = await supabase.rpc('p_nearby_tournaments', {
      ...params,
    });

    if (error) {
      console.error('Error fetching nearby tournaments:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Extract tournament IDs to fetch featured status
    const tournamentIds = data.map((t: Partial<Tournament>) => t.id).filter(Boolean);

    if (tournamentIds.length === 0) {
      return data;
    }

    // Fetch featured status for all nearby tournaments
    const { data: featuredData, error: featuredError } = await supabase
      .from('tournaments')
      .select('id, featured')
      .in('id', tournamentIds);

    if (featuredError) {
      console.error('Error fetching featured status:', featuredError);
      // Return original data without featured status rather than failing
      return data;
    }

    // Create a map of tournament ID to featured status
    const featuredMap = new Map<string, boolean>();
    featuredData?.forEach((t: { id: string; featured: boolean }) => {
      featuredMap.set(t.id, t.featured ?? false);
    });

    // Enrich nearby tournaments with featured status
    return data.map((tournament: Partial<Tournament>) => ({
      ...tournament,
      featured: tournament.id ? featuredMap.get(tournament.id) ?? false : false,
    }));
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
}
