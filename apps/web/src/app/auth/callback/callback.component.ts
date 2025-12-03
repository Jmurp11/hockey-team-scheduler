import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <div class="loading">
        <p>Signing you in...</p>
      </div>
    </div>
  `,
  styles: [
    `
      .callback-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .loading {
        text-align: center;
      }
    `,
  ],
})
export class CallbackComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  ngOnInit() {
    this.handleAuthCallback();
  }

  private async handleAuthCallback() {
    try {
      // Handle the auth callback
      const { data, error } = await this.supabaseService
        .getSupabaseClient()!
        .auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        this.router.navigate(['/login'], {
          queryParams: { error: 'Authentication failed' },
        });
        return;
      }

      if (data.session) {
        const needsProfile = await this.checkUserProfile(data.session.user.id);

        if (needsProfile) {
          this.router.navigate(['/app/complete-profile']);
        } else {
          this.router.navigate(['/app/schedule']);
        }
      } else {
        console.log('No session found');
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Unexpected callback error:', error);
      this.router.navigate(['/login']);
    }
  }

  private async checkUserProfile(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService
        .getSupabaseClient()!
        .from('app_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile check error:', error);
        return true;
      }

      return !data || !data.name || !data.association;
    } catch (error) {
      console.error('Profile check unexpected error:', error);
      return true;
    }
  }
}
