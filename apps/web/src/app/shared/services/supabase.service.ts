import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root', // Add this line
})
export class SupabaseService {
  supabaseClient = signal<SupabaseClient>(
    createClient(
      environment.PUBLIC_SUPABASE_URL,
      environment.PUBLIC_SUPABASE_SERVICE_ROLE
    )
  );

  instantiateSupabase() {
    const supabaseUrl = environment.PUBLIC_SUPABASE_URL || '';
    const supabaseKey = environment.PUBLIC_SUPABASE_SERVICE_ROLE || '';
    this.supabaseClient.set(createClient(supabaseUrl, supabaseKey));
  }

  getSupabaseClient(): SupabaseClient | undefined {
    if (!this.supabaseClient()) {
      this.instantiateSupabase();
    }
    return this.supabaseClient();
  }
}
