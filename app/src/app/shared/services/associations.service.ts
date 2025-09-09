import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AssociationService {
  private supabase = inject(SupabaseService);

  associations() {
    const client = this.supabase.getSupabaseClient();
    if (!client) {
      return Promise.reject('Supabase client is not initialized');
    }

    return client
      .from('associations')
      .select('id,name, city, state, country')
      .order('name', { ascending: true });
  }
}
