import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { IonContent, IonSpinner, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [IonContent, IonSpinner, IonText],
  template: `
    <ion-content class="ion-padding">
      <div class="callback-container">
        <div class="loading">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <ion-text color="medium">
            <p>Signing you in...</p>
          </ion-text>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: transparent;
    }

    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .loading {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      ion-spinner {
        width: 48px;
        height: 48px;
      }

      p {
        margin: 0;
        font-size: 1rem;
      }
    }
  `],
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
      const client = this.supabaseService.getSupabaseClient();
      if (!client) {
        console.error('Supabase client not available');
        this.router.navigate(['/login']);
        return;
      }

      const { data, error } = await client.auth.getSession();

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
          this.router.navigate(['/app/home']);
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
      const client = this.supabaseService.getSupabaseClient();
      if (!client) {
        console.error('Supabase client not available');
        return true;
      }

      const { data, error } = await client
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
