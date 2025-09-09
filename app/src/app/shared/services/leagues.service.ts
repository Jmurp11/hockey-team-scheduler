import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable()
export class LeagueService {
  private supabase = inject(SupabaseService);

  leagues() {
    const client = this.supabase.getSupabaseClient();
    if (!client) {
      return Promise.reject('Supabase client is not initialized');
    }
    return client
      .from('leagues')
      .select('id,name')
      .order('name', { ascending: true });
  }
}
