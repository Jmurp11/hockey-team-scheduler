import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  getSubscriptionStatusSeverity,
  getSubscriptionDateLabel,
  mapToPrimeNgSeverity,
} from '@hockey-team-scheduler/shared-utilities';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-association-admin-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, TagModule],
  template: `
    <div class="admin-header">
      <div class="admin-header__left">
        <div class="admin-header__title-section">
          <h1 class="admin-header__title">{{ associationName }} Administration</h1>
          <div class="admin-header__subtitle">
            <p-avatar
              icon="pi pi-user"
              class="admin-header__avatar"
              size="large"
              shape="circle"
            />
            <span class="admin-header__admin-name">{{ adminName }}</span>
          </div>
        </div>
      </div>
      <div class="admin-header__right">
        <div class="admin-header__subscription">
          <div class="admin-header__subscription-status">
            <span class="admin-header__label">Status</span>
            <p-tag 
              [value]="subscriptionStatus" 
              [severity]="getStatusSeverity(subscriptionStatus)"
            />
          </div>
          @if (subscriptionEndDate) {
            <div class="admin-header__subscription-date">
              <span class="admin-header__label">{{ dateLabel }}</span>
              <span class="admin-header__value">{{ subscriptionEndDate | date:'mediumDate' }}</span>
            </div>
          }
          <div class="admin-header__seats">
            <span class="admin-header__label">Seats</span>
            <span class="admin-header__value">{{ seatsInUse }} / {{ totalSeats }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem 2rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      gap: 2rem;

      &__left {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      &__title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      &__title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-500);
      }

      &__subtitle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      &__avatar {
        --p-avatar-background: var(--secondary-100);
        --p-avatar-color: var(--primary-500);
      }

      &__admin-name {
        color: var(--primary-500);
        font-size: 1.15rem;
        font-weight: 500;
      }

      &__right {
        display: flex;
        align-items: center;
      }

      &__subscription {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding: 0.75rem 1.25rem;
        background: var(--surface-ground);
        border-radius: 8px;
      }

      &__subscription-status,
      &__subscription-date,
      &__seats {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: flex-end;
      }

      &__label {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &__value {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--text-color);
      }
    }

    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        padding: 1rem;

        &__subscription {
          width: 100%;
          justify-content: space-between;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationAdminHeaderComponent {
  @Input() associationName = '';
  @Input() adminName = '';
  @Input() subscriptionStatus: string = 'ACTIVE';
  @Input() subscriptionEndDate: string | null = null;
  @Input() seatsInUse = 0;
  @Input() totalSeats = 0;

  get dateLabel(): string {
    return getSubscriptionDateLabel(this.subscriptionStatus);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return mapToPrimeNgSeverity(getSubscriptionStatusSeverity(status));
  }
}
