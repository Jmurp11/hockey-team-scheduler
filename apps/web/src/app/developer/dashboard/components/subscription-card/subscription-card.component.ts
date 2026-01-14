import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { ApiUserPublic } from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-subscription-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card class="subscription-card">
      <ng-template #title>
        <div class="card-header">
          <i class="pi pi-credit-card"></i>
          <h3>Subscription</h3>
        </div>
      </ng-template>
      <ng-template #content>
        <div class="subscription-info">
          <div class="status-badge" [class]="user?.subscription_status">
            {{ formatStatus(user?.subscription_status) }}
          </div>
          <div class="pricing">
            <span class="price">$0.05</span>
            <span class="unit">per request</span>
          </div>
          <p class="billing-note">
            Usage-based billing. Charged monthly based on API requests.
          </p>
        </div>
      </ng-template>
      <ng-template #footer>
        @if (user?.subscription_status === 'active') {
          <p-button
            label="Cancel Subscription"
            icon="pi pi-times"
            severity="danger"
            variant="outlined"
            [loading]="canceling"
            (onClick)="onCancelSubscription()"
          />
        }
      </ng-template>
    </app-card>
  `,
  styleUrl: './subscription-card.component.scss',
})
export class SubscriptionCardComponent {
  @Input() user: ApiUserPublic | null = null;
  @Input() canceling = false;
  @Output() cancelSubscription = new EventEmitter<void>();

  onCancelSubscription(): void {
    this.cancelSubscription.emit();
  }

  formatStatus(status: string | undefined): string {
    if (!status) return 'Unknown';
    const statusLabels: Record<string, string> = {
      active: 'Active',
      past_due: 'Past Due',
      canceled: 'Canceled',
      unpaid: 'Unpaid',
      incomplete: 'Incomplete',
    };
    return statusLabels[status] || status;
  }
}
