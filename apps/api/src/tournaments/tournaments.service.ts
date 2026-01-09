import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { Tournament, TournamentProps } from '../types';
import { CreateTournamentDto } from './create-tournament.dto';

@Injectable()
export class TournamentsService {
  async getTournaments() {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*');

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw new Error('Failed to fetch tournaments');
    }

    return tournaments;
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

  async getNearbyTournaments(
    params: TournamentProps,
  ): Promise<Partial<Tournament>[]> {
    const { data, error } = await supabase.rpc('p_nearby_tournaments', {
      ...params,
    });

    if (error) {
      console.error('Error fetching nearby tournaments:', error);
    }

    return data;
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
