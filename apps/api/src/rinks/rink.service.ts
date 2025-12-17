import { Injectable } from '@nestjs/common';
import { Rink } from './rink.controller';
import { supabase } from '../supabase';

@Injectable()
export class RinkService {
  async getRinks(): Promise<Rink[]> {
    const { data, error } = await supabase.from('rinks').select('*');

    if (error) {
      console.error('Error fetching rinks:', error);
      throw new Error('Could not fetch rinks');
    }
    return data;
  }
}
