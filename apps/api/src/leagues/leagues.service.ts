import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { League } from '../types';

@Injectable()
export class LeaguesService {
  async getLeague(abbreviation: string): Promise<League | null> {
    const { data: leagueswithjoin, error } = await supabase
      .from('leagueswithjoin')
      .select('*')
      .ilike('league_abbreviation', `${abbreviation}`)
      .single();
    if (error) {
      console.error('Error fetching league:', error);
      throw new Error('Failed to fetch league data');
    }

    if (!leagueswithjoin) {
      console.warn(`No league found with abbreviation: ${abbreviation}`);
      return null;
    }

    const processedLeague = {
      ...leagueswithjoin,
      associations: leagueswithjoin.associations.map((assoc: string) =>
        JSON.parse(assoc),
      ),
    };

    return processedLeague as League;
  }

  async getLeagues(): Promise<League[]> {
    const { data: leagues, error } = await supabase.from('leagues').select('*');
    if (error) {
      console.error('Error fetching leagues:', error);
      throw new Error('Failed to fetch leagues data');
    }
    if (!leagues || leagues.length === 0) {
      console.warn('No leagues found');
      return [];
    }

    return leagues;
  }
}
