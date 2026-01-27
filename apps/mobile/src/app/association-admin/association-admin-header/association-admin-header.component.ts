import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  getSubscriptionStatusSeverity,
  getSubscriptionDateLabel,
  mapToIonicColor,
} from '@hockey-team-scheduler/shared-utilities';
import { IonBadge, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person } from 'ionicons/icons';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'app-association-admin-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, IonIcon, IonBadge],
  template: `
    <div class="admin-header">
      <div class="admin-header__main">
        <div class="admin-header__title-section">
          <h1 class="admin-header__title">{{ associationName }} Administration</h1>
          <div class="admin-header__subtitle">
            <app-avatar class="admin-header__avatar">
              <ion-icon name="person" class="admin-header__icon"></ion-icon>
            </app-avatar>
            <span class="admin-header__admin-name">{{ adminName }}</span>
          </div>
        </div>
      </div>
      <div class="admin-header__subscription">
        <div class="admin-header__subscription-row">
          <div class="admin-header__subscription-item">
            <span class="admin-header__label">Status</span>
            <ion-badge [color]="getStatusColor(subscriptionStatus)">
              {{ subscriptionStatus }}
            </ion-badge>
          </div>
          @if (subscriptionEndDate) {
            <div class="admin-header__subscription-item">
              <span class="admin-header__label">{{ dateLabel }}</span>
              <span class="admin-header__value">{{ subscriptionEndDate | date:'mediumDate' }}</span>
            </div>
          }
          <div class="admin-header__subscription-item">
            <span class="admin-header__label">Seats</span>
            <span class="admin-header__value">{{ seatsInUse }} / {{ totalSeats }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-header {
      padding: 1rem;
      background: var(--ion-color-light);
      border-bottom: 1px solid var(--ion-color-light-shade);

      &__main {
        margin-bottom: 1rem;
      }

      &__title-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      &__title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-500);
      }

      &__subtitle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      &__avatar {
        width: 32px;
        height: 32px;

        ::ng-deep ion-avatar {
          width: 100%;
          height: 100%;
          background: var(--secondary-200);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      &__icon {
        font-size: 1rem;
        color: var(--primary-500);
      }

      &__admin-name {
        color: var(--ion-color-medium);
        font-size: 0.9rem;
      }

      &__subscription {
        background: var(--ion-background-color);
        padding: 0.75rem;
        border-radius: 8px;
      }

      &__subscription-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &__subscription-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      &__label {
        font-size: 0.7rem;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &__value {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--ion-text-color);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationAdminHeaderComponent {
  @Input() associationName = '';
  @Input() adminName = '';
  @Input() subscriptionStatus = 'ACTIVE';
  @Input() subscriptionEndDate: string | null = null;
  @Input() seatsInUse = 0;
  @Input() totalSeats = 0;

  constructor() {
    addIcons({ person });
  }

  get dateLabel(): string {
    return getSubscriptionDateLabel(this.subscriptionStatus);
  }

  getStatusColor(status: string): string {
    return mapToIonicColor(getSubscriptionStatusSeverity(status));
  }
}
