import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UpdateUser } from '@hockey-team-scheduler/shared-utilities';
import { AuthService } from './auth.service';
import { APP_CONFIG } from '../config/app-config';
import { firstValueFrom } from 'rxjs';

/**
 * Parameters for completing user registration via the API.
 */
export interface CompleteRegistrationDto {
  userId: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  associationId: number;
  teamId: number;
  age?: string;
}

/**
 * Response from the complete registration API endpoint.
 */
export interface CompleteRegistrationResponse {
  success: boolean;
  message: string;
  isMultiSeat: boolean;
  appUser: any;
  manager: any;
  associationMember: any | null;
}

@Injectable({providedIn: 'root'})
export class UserService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
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

  async logout() {
    try {
      const { error } = await this.supabaseClient!.auth.signOut();
      // Only log non-session-missing errors, as session missing is expected
      // when the user's session has already expired
      if (error && error.message !== 'Auth session missing!') {
        console.error('Error logging out:', error);
      }
    } catch (error) {
      // Silently handle errors during logout - we still want to clear local state
      console.warn('Logout error (continuing with local cleanup):', error);
    }

    // Always clear the session and current user in auth service
    this.authService.session.set(null);
    this.authService.currentUser.set(null);
    return { success: true };
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

  /**
   * Completes user registration after subscription or invitation.
   * This is the primary registration workflow that:
   * 1. Updates app_users with profile data
   * 2. Updates auth user with password
   * 3. Creates manager record (idempotent)
   * 4. Creates association_members for multi-seat subscriptions (idempotent)
   *
   * All operations are idempotent and safe to retry.
   *
   * @param dto - Registration completion data
   * @returns Promise with registration result
   */
  async completeRegistration(dto: CompleteRegistrationDto): Promise<CompleteRegistrationResponse> {
    const response = await firstValueFrom(
      this.http.post<CompleteRegistrationResponse>(
        `${this.config.apiUrl}/users/complete-registration`,
        dto
      )
    );

    return response;
  }
}
