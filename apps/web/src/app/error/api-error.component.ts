import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { HealthCheckService } from '@hockey-team-scheduler/shared-data-access';

@Component({
  selector: 'app-api-error',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  template: `
    <div class="error-container">
      <p-card styleClass="error-card">
        <ng-template pTemplate="content">
          <div class="error-content">
            <div class="error-icon-container">
              <i class="pi pi-exclamation-triangle error-icon"></i>
            </div>
            <h2>We're Having Technical Difficulties</h2>
            <p>
              Our servers are temporarily unavailable. We're working to restore
              service as quickly as possible.
            </p>
            <p class="error-detail">Please try again in a few moments.</p>
            <div class="action-buttons">
              <p-button
                label="Try Again"
                icon="pi pi-refresh"
                (onClick)="retry()"
                [loading]="isRetrying()"
              />
            </div>
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [
    `
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        width: 100%;
        padding: 2rem;
        background: var(--p-surface-ground);
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      :host ::ng-deep .error-card {
        width: 100%;
        max-width: 550px;
        border-top: 4px solid var(--p-red-500);
      }

      .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        gap: 1.5rem;
        text-align: center;
      }

      .error-icon-container {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(
          135deg,
          var(--p-red-50) 0%,
          var(--p-red-100) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-icon {
        font-size: 3rem;
        color: var(--p-red-500);
      }

      h2 {
        font-size: 1.5rem;
        color: var(--p-text-color);
        margin: 0;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      p {
        color: var(--p-text-muted-color);
        line-height: 1.6;
        margin: 0;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      .error-detail {
        font-size: 0.9rem;
        color: var(--p-text-muted-color);
      }

      .action-buttons {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        width: 100%;
        margin-top: 0.5rem;
      }

      :host ::ng-deep .action-buttons .p-button {
        min-width: 180px;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      @media (max-width: 768px) {
        .error-container {
          padding: 1rem;
        }

        .error-content {
          padding: 1rem;
        }
      }

      @media (max-width: 480px) {
        .action-buttons {
          flex-direction: column;
        }

        :host ::ng-deep .action-buttons .p-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class ApiErrorComponent {
  private healthCheckService = inject(HealthCheckService);
  private router = inject(Router);

  isRetrying = signal(false);

  async retry() {
    this.isRetrying.set(true);
    const result = await this.healthCheckService.checkHealth();
    this.isRetrying.set(false);

    if (result.isHealthy) {
      this.router.navigate(['/']);
    }
  }
}
