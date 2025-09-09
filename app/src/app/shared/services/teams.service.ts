import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { NearbyTeamsParams } from '../types/nearby-teams.type';

@Injectable()
export class TeamsService {
  private supabase = inject(SupabaseService);

  teams(association?: number) {
    const client = this.supabase.getSupabaseClient();
    if (!client) {
      return Promise.reject('Supabase client is not initialized');
    }

    if (association) {
      return client
        .from('rankings')
        .select('id,team_name')
        .eq('association', association)
        .order('team_name', { ascending: true });
    }

    return client
      .from('rankings')
      .select('id,team_name')
      .order('team_name', { ascending: true });
  }

  async nearbyTeams(params: NearbyTeamsParams) {
    const client = this.supabase.getSupabaseClient();
    if (!client) {
      return Promise.reject('Supabase client is not initialized');
    }

    const { data, error } = await client.rpc('p_find_nearby_teams', {
      ...params,
    });

    if (error) {
      console.error('Error fetching nearby teams:', error);
    }

    return data;
  }
}
