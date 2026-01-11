import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { IonContent, IonSpinner, IonText, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, shieldCheckmark } from 'ionicons/icons';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner, IonText, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="callback-container">
        <div class="loading-card">
          <!-- Animated logo/icon area -->
          <div class="logo-container">
            <div class="logo-ring"></div>
            <ion-icon name="shield-checkmark" class="logo-icon"></ion-icon>
          </div>

          <!-- Status indicator -->
          <div class="status-section">
            <ion-spinner name="dots" color="secondary"></ion-spinner>
            <ion-text>
              <h2 class="status-title">{{ statusMessage() }}</h2>
              <p class="status-subtitle">{{ statusSubtitle() }}</p>
            </ion-text>
          </div>

          <!-- Progress steps -->
          <div class="progress-steps">
            <div class="step" [class.active]="currentStep() >= 1" [class.complete]="currentStep() > 1">
              <ion-icon name="checkmark-circle" *ngIf="currentStep() > 1"></ion-icon>
              <span *ngIf="currentStep() <= 1">1</span>
              <span class="step-label">Authenticating</span>
            </div>
            <div class="step-line" [class.active]="currentStep() >= 2"></div>
            <div class="step" [class.active]="currentStep() >= 2" [class.complete]="currentStep() > 2">
              <ion-icon name="checkmark-circle" *ngIf="currentStep() > 2"></ion-icon>
              <span *ngIf="currentStep() <= 2">2</span>
              <span class="step-label">Loading Profile</span>
            </div>
            <div class="step-line" [class.active]="currentStep() >= 3"></div>
            <div class="step" [class.active]="currentStep() >= 3" [class.complete]="currentStep() > 3">
              <ion-icon name="checkmark-circle" *ngIf="currentStep() > 3"></ion-icon>
              <span *ngIf="currentStep() <= 3">3</span>
              <span class="step-label">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    @use 'mixins/flex' as *;

    ion-content {
      --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
    }

    .callback-container {
      @include flex(center, center, column);
      height: 100%;
      padding: 2rem;
    }

    .loading-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 340px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      @include flex(center, center, column);
      gap: 2rem;
    }

    .logo-container {
      position: relative;
      width: 80px;
      height: 80px;
      @include flex(center, center, row);

      .logo-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid var(--ion-color-secondary);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
      }

      .logo-icon {
        font-size: 40px;
        color: var(--ion-color-secondary);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .status-section {
      @include flex(center, center, column);
      gap: 0.75rem;
      text-align: center;

      ion-spinner {
        width: 32px;
        height: 32px;
      }

      .status-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--ion-color-dark);
      }

      .status-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: var(--ion-color-medium);
      }
    }

    .progress-steps {
      @include flex(center, center, row);
      width: 100%;
      gap: 0;

      .step {
        @include flex(center, center, column);
        gap: 0.5rem;
        opacity: 0.4;
        transition: all 0.3s ease;

        span:first-child, ion-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--ion-color-light);
          @include flex(center, center, row);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ion-color-medium);
        }

        ion-icon {
          font-size: 28px;
          color: var(--ion-color-success);
          background: transparent;
        }

        .step-label {
          font-size: 0.7rem;
          color: var(--ion-color-medium);
          white-space: nowrap;
        }

        &.active {
          opacity: 1;

          span:first-child {
            background: var(--ion-color-secondary);
            color: white;
          }

          .step-label {
            color: var(--ion-color-dark);
            font-weight: 500;
          }
        }

        &.complete {
          opacity: 1;
        }
      }

      .step-line {
        flex: 1;
        height: 2px;
        background: var(--ion-color-light-shade);
        margin: 0 0.25rem;
        margin-bottom: 1.5rem;
        transition: background 0.3s ease;

        &.active {
          background: var(--ion-color-secondary);
        }
      }
    }
  `],
})
export class CallbackComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  // UI state signals
  currentStep = signal<number>(1);
  statusMessage = signal<string>('Signing you in...');
  statusSubtitle = signal<string>('Please wait a moment');

  constructor() {
    addIcons({ checkmarkCircle, shieldCheckmark });
  }

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
      this.router.navigate(['/auth/login'], {
        queryParams: { error: 'Authentication timed out. Please try again.' },
      });
    }, 15000); // 15 second timeout

    try {
      // Step 1: Authenticating
      this.currentStep.set(1);
      this.statusMessage.set('Authenticating...');
      this.statusSubtitle.set('Verifying your credentials');

      const client = this.supabaseService.getSupabaseClient();
      if (!client) {
        console.error('Supabase client not available');
        this.clearTimeoutAndNavigate('/auth/login');
        return;
      }

      // First check if we already have a session from the login
      let session = this.authService.session();

      // If no session in AuthService, try to get it from Supabase
      if (!session) {
        const { data, error } = await client.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          this.clearTimeoutAndNavigate('/auth/login', { error: 'Authentication failed' });
          return;
        }

        session = data.session;
      }

      if (!session) {
        console.error('No session found');
        this.clearTimeoutAndNavigate('/auth/login');
        return;
      }

      // Step 2: Loading Profile
      this.currentStep.set(2);
      this.statusMessage.set('Loading your profile...');
      this.statusSubtitle.set('Setting up your experience');

      // Ensure session is set in AuthService
      this.authService.setSession(session);

      // Small delay for visual feedback
      await this.delay(500);

      const needsProfile = await this.checkUserProfile(session.user.id);

      // Step 3: Ready
      this.currentStep.set(3);
      this.statusMessage.set('Almost there!');
      this.statusSubtitle.set('Preparing your dashboard');

      // Small delay for visual feedback
      await this.delay(300);

      if (needsProfile) {
        this.clearTimeoutAndNavigate('/app/complete-profile');
      } else {
        this.clearTimeoutAndNavigate('/app/dashboard');
      }
    } catch (error) {
      console.error('Unexpected callback error:', error);
      this.clearTimeoutAndNavigate('/auth/login');
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
