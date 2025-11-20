import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { inject, Injectable, signal } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../config/app-config';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private config = inject(APP_CONFIG);
  
  supabaseClient = signal<SupabaseClient>(
    createClient(
      this.config.supabaseUrl,
      this.config.supabaseAnonKey
    )
  );

  instantiateSupabase() {
    const supabaseUrl = this.config.supabaseUrl || '';
    const supabaseKey = this.config.supabaseAnonKey || '';
    this.supabaseClient.set(createClient(supabaseUrl, supabaseKey));
  }

  getSupabaseClient(): SupabaseClient | undefined {
    if (!this.supabaseClient()) {
      this.instantiateSupabase();
    }
    return this.supabaseClient();
  }
}
