import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthService,
  SupabaseService,
  UserAccessService,
} from '@hockey-team-scheduler/shared-data-access';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <div class="loading-card">
        <p-progressspinner
          [style]="{width: '48px', height: '48px'}"
          strokeWidth="4"
          animationDuration="1s"
        />
        <div class="status-text">
          <h2 class="status-title">{{ statusMessage() }}</h2>
          <p class="status-subtitle">{{ statusSubtitle() }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'mixins/mixins' as *;

    .callback-container {
      @include flex(center, center, column);
      height: 100vh;
      padding: 2rem;
      background: var(--surface-50);
    }

    .loading-card {
      background: white;
      border-radius: 16px;
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 340px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      @include flex(center, center, column);
      gap: 1.5rem;
    }

    ::ng-deep .p-progress-spinner-circle {
      stroke: var(--secondary-500) !important;
    }

    .status-text {
      text-align: center;
      @include flex(center, center, column);
      gap: 0.375rem;

      .status-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--surface-800);
      }

      .status-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: var(--surface-500);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private userAccessService = inject(UserAccessService);
  private router = inject(Router);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  // UI state signals
  statusMessage = signal<string>('Signing you in...');
  statusSubtitle = signal<string>('Please wait a moment');

  ngOnInit() {
    this.handleAuthCallback();
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private async handleAuthCallback() {
    // Set a timeout to prevent infinite hanging
    this.timeoutId = setTimeout(() => {
      console.error('Auth callback timeout - redirecting to login');
      this.router.navigate(['/login'], {
        queryParams: { error: 'Authentication timed out. Please try again.' },
      });
    }, 15000); // 15 second timeout

    try {
      this.statusMessage.set('Authenticating...');
      this.statusSubtitle.set('Verifying your credentials');

      const client = this.supabaseService.getSupabaseClient();
      if (!client) {
        console.error('Supabase client not available');
        this.clearTimeoutAndNavigate('/login');
        return;
      }

      // First check if we already have a session from the login
      let session = this.authService.session();

      // If no session in AuthService, try to get it from Supabase
      if (!session) {
        const { data, error } = await client.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          this.clearTimeoutAndNavigate('/login', { error: 'Authentication failed' });
          return;
        }

        session = data.session;
      }

      if (!session) {
        console.error('No session found');
        this.clearTimeoutAndNavigate('/login');
        return;
      }

      this.statusMessage.set('Loading your profile...');
      this.statusSubtitle.set('Setting up your experience');

      // Ensure session is set in AuthService
      this.authService.setSession(session);

      // Small delay for visual feedback
      await this.delay(500);

      // Load user access info (determines routing based on user type)
      this.statusMessage.set('Determining access...');
      this.statusSubtitle.set('Checking your permissions');

      const access = await this.userAccessService.loadUserAccess();

      this.statusMessage.set('Almost there!');
      this.statusSubtitle.set('Preparing your dashboard');

      await this.delay(300);

      if (!access) {
        // No access info - fall back to legacy behavior
        const needsProfile = await this.checkUserProfile(session.user.id);
        if (needsProfile) {
          this.clearTimeoutAndNavigate('/app/complete-profile');
        } else {
          this.clearTimeoutAndNavigate('/app/schedule');
        }
        return;
      }

      // Route based on user type
      const redirectPath = this.userAccessService.getRedirectPath();
      console.log(`[Callback] User type: ${access.userType}, redirecting to: ${redirectPath}`);

      this.clearTimeoutAndNavigate(redirectPath);
    } catch (error) {
      console.error('Unexpected callback error:', error);
      this.clearTimeoutAndNavigate('/login');
    }
  }

  private clearTimeoutAndNavigate(path: string, queryParams?: Record<string, string>) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.router.navigate([path], queryParams ? { queryParams } : undefined);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
