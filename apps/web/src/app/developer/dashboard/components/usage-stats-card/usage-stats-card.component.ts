import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ApiUsageStats } from '@hockey-team-scheduler/shared-utilities';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-usage-stats-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card class="usage-card">
      <ng-template #title>
        <div class="card-header">
          <i class="pi pi-chart-bar"></i>
          <h3>Usage Statistics</h3>
        </div>
      </ng-template>
      <ng-template #content>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-value">{{ usage?.totalRequests || 0 }}</span>
            <span class="stat-label">Total Requests</span>
          </div>
          <div class="stat">
            <span class="stat-value">
              {{ formatCurrency(usage?.estimatedCost || 0) }}
            </span>
            <span class="stat-label">Current Bill</span>
          </div>
        </div>
        @if (usage?.lastRequestAt) {
          <p class="last-request">
            Last request: {{ formatDate(usage?.lastRequestAt) }}
          </p>
        }
      </ng-template>
    </app-card>
  `,
  styleUrl: './usage-stats-card.component.scss',
})
export class UsageStatsCardComponent {
  @Input() usage: ApiUsageStats | null = null;

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
