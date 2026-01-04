import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface AcceptInvitationResponse {
  success: boolean;
  email?: string;
  associationId?: string;
  associationName?: string;
  message?: string;
}

@Component({
  selector: 'app-invite-accept',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSpinner,
    CardComponent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    ButtonComponent,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="auth-container">
        @if (loading()) {
          <app-card>
            <ion-card-header>
              <ion-card-title>Processing Invitation</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Please wait while we process your invitation...</p>
              </div>
            </ion-card-content>
          </app-card>
        } @else if (error()) {
          <app-card>
            <ion-card-header>
              <ion-card-title>Invitation Error</ion-card-title>
              <ion-card-subtitle>{{ errorMessage() }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="form-actions">
                <app-button
                  expand="block"
                  color="primary"
                  (onClick)="goToLogin()"
                >
                  Go to Login
                </app-button>
              </div>
            </ion-card-content>
          </app-card>
        } @else {
          <app-card>
            <ion-card-header>
              <ion-card-title>Welcome to {{ associationName() }}!</ion-card-title>
              <ion-card-subtitle>
                Your invitation has been accepted. Please request a magic link to complete your profile setup.
              </ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="form-actions">
                <app-button
                  expand="block"
                  color="primary"
                  (onClick)="continueToMagicLink()"
                >
                  Continue to Login
                </app-button>
              </div>
            </ion-card-content>
          </app-card>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: transparent;
    }

    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
      padding: 1rem;
    }

    app-card {
      width: 100%;
      max-width: 600px;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;

      ion-spinner {
        width: 48px;
        height: 48px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
        text-align: center;
      }
    }

    .form-actions {
      margin: 2rem 0 1rem 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  loading = signal(true);
  error = signal(false);
  errorMessage = signal('');
  email = signal('');
  associationName = signal('RinkLink.ai');

  async ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.error.set(true);
      this.errorMessage.set('No invitation token provided. Please check your invitation link.');
      this.loading.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AcceptInvitationResponse>(
          `${environment.apiUrl}/users/invitations/accept`,
          { token }
        )
      );

      if (response.success) {
        this.email.set(response.email || '');
        this.associationName.set(response.associationName || 'RinkLink.ai');
        
        // Store email for magic link page
        if (response.email) {
          sessionStorage.setItem('invitedEmail', response.email);
        }
      } else {
        this.error.set(true);
        this.errorMessage.set(response.message || 'Invalid or expired invitation.');
      }
    } catch (err: any) {
      this.error.set(true);
      this.errorMessage.set(
        err?.error?.message || 'Failed to process invitation. It may have expired or already been used.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  continueToMagicLink() {
    this.router.navigate(['/welcome'], {
      queryParams: {
        email: this.email(),
        invited: true,
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
