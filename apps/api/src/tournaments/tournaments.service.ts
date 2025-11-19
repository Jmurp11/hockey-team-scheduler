import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { Tournament, TournamentProps } from '../types';

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
}
