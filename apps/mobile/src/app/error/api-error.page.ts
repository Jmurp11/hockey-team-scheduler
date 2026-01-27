import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, refreshOutline } from 'ionicons/icons';
import { HealthCheckService } from '@hockey-team-scheduler/shared-data-access';

@Component({
  selector: 'app-api-error',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="error-container">
        <ion-card class="error-card">
          <ion-card-content>
            <div class="error-content">
              <div class="error-icon-container">
                <ion-icon name="alert-circle-outline"></ion-icon>
              </div>
              <h2>We're Having Technical Difficulties</h2>
              <p>
                Our servers are temporarily unavailable. We're working to
                restore service as quickly as possible.
              </p>
              <p class="error-detail">Please try again in a few moments.</p>
              <ion-button
                expand="block"
                class="retry-button"
                (click)="retry()"
                [disabled]="isRetrying()"
                color="secondary"
              >
                @if (isRetrying()) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  <ion-icon name="refresh-outline" slot="start"></ion-icon>
                  Try Again
                }
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }

      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 1rem;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      .error-card {
        width: 100%;
        max-width: 550px;
        border-top: 4px solid var(--ion-color-danger);
        border-radius: 12px;
      }

      .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem 0.5rem;
        gap: 1.25rem;
        text-align: center;
      }

      .error-icon-container {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(
          135deg,
          rgba(var(--ion-color-danger-rgb), 0.1) 0%,
          rgba(var(--ion-color-danger-rgb), 0.2) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-icon-container ion-icon {
        font-size: 3rem;
        color: var(--ion-color-danger);
      }

      h2 {
        font-size: 1.35rem;
        font-weight: 600;
        color: var(--ion-text-color);
        margin: 0;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      p {
        color: var(--ion-color-medium);
        line-height: 1.6;
        margin: 0;
        font-size: 0.95rem;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      .error-detail {
        font-size: 0.875rem;
      }

      .retry-button {
        margin-top: 0.5rem;
        min-width: 180px;
        --border-radius: 8px;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      ion-spinner {
        width: 20px;
        height: 20px;
      }

      @media (max-width: 480px) {
        .error-content {
          padding: 1rem 0;
        }

        .retry-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class ApiErrorPage {
  private healthCheckService = inject(HealthCheckService);
  private router = inject(Router);

  isRetrying = signal(false);

  constructor() {
    addIcons({ alertCircleOutline, refreshOutline });
  }

  async retry() {
    this.isRetrying.set(true);
    const result = await this.healthCheckService.checkHealth();
    this.isRetrying.set(false);

    if (result.isHealthy) {
      this.router.navigate(['/']);
    }
  }
}
