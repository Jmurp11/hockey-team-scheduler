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
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardComponent } from '../../shared/components/card/card.component';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { environment } from '../../environments/environment';
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
    AuthContainerComponent,
    CardComponent,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  template: `
    <app-auth-container>
      @if (loading()) {
        <app-card class="card">
          <ng-template #title>Processing Invitation</ng-template>
          <ng-template #content>
            <div class="loading-container">
              <p-progressSpinner 
                styleClass="w-4rem h-4rem" 
                strokeWidth="4"
              />
              <p>Please wait while we process your invitation...</p>
            </div>
          </ng-template>
        </app-card>
      } @else if (error()) {
        <app-card class="card">
          <ng-template #title>Invitation Error</ng-template>
          <ng-template #subtitle>{{ errorMessage() }}</ng-template>
          <ng-template #content>
            <div class="form-actions">
              <p-button
                label="Go to Login"
                styleClass="w-full"
                (click)="goToLogin()"
              />
            </div>
          </ng-template>
        </app-card>
      } @else {
        <app-card class="card">
          <ng-template #title>Welcome to {{ associationName() }}!</ng-template>
          <ng-template #subtitle>
            Your invitation has been accepted. Please request a magic link to complete your profile setup.
          </ng-template>
          <ng-template #content>
            <div class="form-actions">
              <p-button
                label="Continue to Login"
                styleClass="w-full"
                (click)="continueToMagicLink()"
              />
            </div>
          </ng-template>
        </app-card>
      }
    </app-auth-container>
  `,
  styles: [`
    .card {
      width: 100%;
      height: 100%;
      max-height: 500px;
      max-width: 600px;
      border-radius: 12px;
      margin-top: 2rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;

      p {
        color: #666;
        margin: 0;
      }
    }

    .form-actions {
      margin: 2rem 0 1.5rem 0;

      ::ng-deep .p-button {
        height: 3rem;
        width: 350px;
      }
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
