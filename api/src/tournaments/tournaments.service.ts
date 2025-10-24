import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';

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
}
