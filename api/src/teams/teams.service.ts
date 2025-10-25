import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { NearbyTeamsParams, Team, TeamsQueryParams } from '../types';

@Injectable()
export class TeamsService {
  async getTeam(id: number): Promise<Team | null> {
    const { data: rankingswithassoc, error } = await supabase
      .from('rankingswithassoc')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching team:', error);
      throw new Error('Failed to fetch team data');
    }

    return {
      id: rankingswithassoc.id,
      name: rankingswithassoc.team_name,
      age: rankingswithassoc.age,
      rating: rankingswithassoc.rating,
      record: rankingswithassoc.record,
      agd: rankingswithassoc.agd,
      sched: rankingswithassoc.sched,
      association: {
        name: rankingswithassoc.name,
        city: rankingswithassoc.city,
        state: rankingswithassoc.state,
        country: rankingswithassoc.country,
      },
    } as Team;
  }

  async getTeams(params: TeamsQueryParams): Promise<Team[]> {
    const filters = [
      { field: 'age', value: params.age },
      { field: 'association', value: params.association },
      { field: 'girls_only', value: params.girls_only },
    ];
    let query = supabase.from('rankingswithassoc').select('*');

    filters.forEach(({ field, value }) => {
      if (field !== 'girls_only' && field !== 'association' && value) {
        query = query.ilike(field, `%${value}%`);
      } else if ((field === 'girls_only' || field === 'association') && value) {
        query = query.eq(field, value);
      }
    });

    const { data: rankingswithassoc, error } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams data');
    }

    if (!rankingswithassoc || rankingswithassoc.length === 0) {
      console.warn(`No teams found for filters: ${JSON.stringify(filters)}`);
      return [];
    }

    const teams = rankingswithassoc.map((team) => ({
      id: team.id,
      name: team.team_name,
      age: team.age,
      rating: team.rating,
      record: team.record,
      agd: team.agd,
      sched: team.sched,
      association: {
        name: team.name,
        city: team.city,
        state: team.state,
        country: team.country,
      },
    }));
    return teams as Team[];
  }

  async getNearbyTeams(params: NearbyTeamsParams): Promise<Partial<Team>[]> {
    const { data, error } = await supabase.rpc('p_find_nearby_teams', {
      ...params,
    });

    if (error) {
      console.error('Error fetching nearby teams:', error);
    }

    return data;
  }
}
