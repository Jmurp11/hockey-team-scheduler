import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UpdateUser } from '@hockey-team-scheduler/shared-utilities';
import { AuthService } from './auth.service';
@Injectable({providedIn: 'root'})
export class UserService {
  supabaseClient = inject(SupabaseService).getSupabaseClient();
  authService = inject(AuthService);

  async updateUserProfile(update: UpdateUser) {

    const updateAuthUser = await this.supabaseClient!.auth.updateUser({
      email: update.email,
      password: update.password,
      data: {
        displayName: update.name,
      },
    });

    if (updateAuthUser.error) {
      console.error('Error updating user profile:', updateAuthUser.error);
      throw updateAuthUser.error;
    }

    const updateAppUser = await this.supabaseClient!.from('app_users')
      .update({
        association: update.association,
        team: update.team,
        age: update.age,
        phone: update.phone,
        name: update.name,
      })
      .eq('user_id', update.id)
      .select();

    if (updateAppUser.error) {
      console.error('Error updating app user:', updateAppUser.error);
      throw updateAppUser.error;
    }

    return updateAppUser.data;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabaseClient!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error logging in:', error);
      throw error;
    }

    return data;
  }

  async loginWithMagicLink(email: string) {
    let { data, error } = await this.supabaseClient!.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    return { data, error };
  }

  updatePassword(password: string) {
    return this.supabaseClient!.auth.updateUser({
      password: password,
    });
  }

  sendPasswordResetEmail(email: string) {
    return this.supabaseClient!.auth.resetPasswordForEmail(email);
  }

  getAge(team: string) {
    const ageGroupRegex = /\b(\d{1,2}U)\b/;
    const match = team.match(ageGroupRegex);
    return match ? match[1] : null;
  }

  updateAssociationMember(user: UpdateUser) {
    return this.supabaseClient!.from('association_members').upsert({
      user_id: user.id,
      association: user.association,
      role: 'MANAGER'
    });
  }
}
