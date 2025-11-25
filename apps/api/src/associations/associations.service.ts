import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { AssociationFull } from '../types';
@Injectable()
export class AssociationsService {
  async getAssociation(id: number): Promise<AssociationFull | null> {
    let { data: associationsfull, error } = await supabase
      .from('associationsfull')
      .select('*')
      .eq('id', `${id}`);
    if (error) {
      console.error('Error fetching association:', error);
      throw new Error('Failed to fetch association data');
    }

    if (!associationsfull || associationsfull.length === 0) {
      console.warn(`No association found with id: ${id}`);
      return null;
    }

    associationsfull = associationsfull.map((assoc) => ({
      ...assoc,
      leagues: assoc.leagues.map((league) => JSON.parse(league)),
      teams: assoc.teams.map((team) => JSON.parse(team)),
    }));

    return associationsfull[0] as AssociationFull;
  }

  // ...existing code...
  async getAssociations(
    city?: string,
    name?: string,
    state?: string,
  ): Promise<AssociationFull[]> {
    const filters = [
      { field: 'name', value: name },
      { field: 'city', value: city },
      { field: 'state', value: state },
    ];

    let query = supabase.from('associationsfull').select('*');

    // Apply filters dynamically
    filters.forEach(({ field, value }) => {
      if (value) {
        query = query.ilike(field, `%${value}%`);
      }
    });

    const { data: associationsfull, error } = await query;

    if (error) {
      console.error('Error fetching associations:', error);
      throw new Error('Failed to fetch associations data');
    }

    if (!associationsfull || associationsfull.length === 0) {
      console.warn('No associations found');
      return [];
    }

    const processedAssociations = associationsfull.map((assoc) => ({
      ...assoc,
      leagues: assoc.leagues.map((league) => JSON.parse(league)),
      teams: assoc.teams.map((team) => JSON.parse(team)),
    }));

    return processedAssociations as AssociationFull[];
  }
  // ...existing code...

  async getAssociationsByState(state: string): Promise<AssociationFull[]> {
    let { data: associationsfull, error } = await supabase
      .from('associationsfull')
      .select('*')
      .ilike('state', `%${state}%`);
    if (error) {
      console.error('Error fetching associations:', error);
      throw new Error('Failed to fetch associations data');
    }
    if (!associationsfull || associationsfull.length === 0) {
      console.warn('No associations found');
      return [];
    }

    associationsfull = associationsfull.map((assoc) => ({
      ...assoc,
      leagues: assoc.leagues.map((league) => JSON.parse(league)),
      teams: assoc.teams.map((team) => JSON.parse(team)),
    }));

    return associationsfull as AssociationFull[];
  }
}
