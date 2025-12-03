import { inject, Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  supabaseClient = inject(SupabaseService).getSupabaseClient();

  session = signal<Session | null>(null);
  currentUser = signal<any>(null);

  async setSession(session: Session | null) {
    this.session.set(session);
    if (session) {
      await this.setCurrentUser(session.user.id);
    } else {
      this.currentUser.set(null);
    }
  }

  async setCurrentUser(id: string) {
    const { data, error } = await this.supabaseClient!.from('app_user_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }

    this.currentUser.set(data);
  }
}
