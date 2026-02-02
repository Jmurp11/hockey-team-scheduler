import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronDownOutline,
  chevronUpOutline,
  informationCircleOutline,
  locationOutline,
  searchOutline,
  starOutline,
  checkmarkCircleOutline,
  warningOutline,
} from 'ionicons/icons';

import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { OpponentMatch } from '@hockey-team-scheduler/shared-utilities';
import { EmailDraftFormComponent } from '../../../shared/components/email-draft-form/email-draft-form.component';

@Component({
  selector: 'app-game-match-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonIcon,
    IonSpinner,
    EmailDraftFormComponent,
  ],
  template: `
    <div class="match-card" [class.expanded]="expanded()">
      <!-- Card Header (tappable) -->
      <div class="match-card__header" (click)="toggleExpanded()">
        <div class="match-card__rank">
          {{ match().rank }}
        </div>

        <div class="match-card__info">
          <div class="match-card__team-name">{{ match().team.name }}</div>
          <div class="match-card__meta">
            <span class="match-card__rating">
              <ion-icon name="star-outline"></ion-icon>
              {{ match().team.rating }}
            </span>
            <span class="match-card__distance">
              <ion-icon name="location-outline"></ion-icon>
              {{ match().distanceMiles }} mi
            </span>
          </div>
        </div>

        <div class="match-card__status">
          @if (match().managerStatus === 'found') {
            <ion-badge color="success">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              Contact
            </ion-badge>
          }
        </div>

        <ion-icon
          [name]="expanded() ? 'chevron-up-outline' : 'chevron-down-outline'"
          class="match-card__toggle"
        ></ion-icon>
      </div>

      <!-- Explanation -->
      <div class="match-card__explanation">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>{{ match().explanation }}</span>
        @if (match().alreadyPlayed) {
          <ion-badge color="medium">Previously Played</ion-badge>
        }
      </div>

      <!-- Expanded Content -->
      @if (expanded()) {
        <div class="match-card__content">
          @if (isSearching()) {
            <div class="match-card__searching">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Searching for contact information...</p>
            </div>
          } @else if (match().manager && match().emailDraft) {
            <div class="match-card__manager">
              <div class="match-card__manager-label">Manager Contact</div>
              <div class="match-card__manager-info">
                <strong>{{ match().manager?.name }}</strong>
                <span>{{ match().manager?.email }}</span>
                @if (match().manager?.phone) {
                  <span>{{ match().manager?.phone }}</span>
                }
              </div>
            </div>

            <app-email-draft-form
              [emailDraft]="match().emailDraft!"
              [pendingAction]="emailPendingAction()"
              [editableSubject]="editableSubject()"
              [editableBody]="editableBody()"
              [disabled]="disabled()"
              [compact]="true"
              [rows]="3"
              (subjectChange)="editableSubject.set($event)"
              (bodyChange)="editableBody.set($event)"
              (confirm)="onSendEmail($event)"
              (decline)="expanded.set(false)"
            />
          } @else if (match().manager && !match().emailDraft) {
            <div class="match-card__manager">
              <div class="match-card__manager-label">Manager Contact</div>
              <div class="match-card__manager-info">
                <strong>{{ match().manager?.name }}</strong>
                @if (match().manager?.phone) {
                  <span>{{ match().manager?.phone }}</span>
                }
              </div>
            </div>
            <div class="match-card__no-email">
              <ion-icon name="warning-outline"></ion-icon>
              <p>No email address found. You may need to reach out by phone or through their association website.</p>
            </div>
            <ion-button fill="outline" size="small" expand="block" class="match-card__search-btn" (click)="onFindContact()">
              <ion-icon name="search-outline" slot="start"></ion-icon>
              Search for Email
            </ion-button>
          } @else {
            <div class="match-card__no-contact">
              <ion-icon name="information-circle-outline"></ion-icon>
              <p>No contact information available for this team's manager.</p>
              <ion-button fill="outline" size="small" (click)="onFindContact()">
                <ion-icon name="search-outline" slot="start"></ion-icon>
                Search for Contact
              </ion-button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .match-card {
      background: var(--ion-background-color);
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 8px;
      overflow: hidden;

      &.expanded {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &__header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 0.75rem;
        cursor: pointer;
      }

      &__rank {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        background: var(--ion-color-secondary);
        color: white;
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.8125rem;
        flex-shrink: 0;
      }

      &__info {
        flex: 1;
        min-width: 0;
      }

      &__team-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--ion-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &__meta {
        display: flex;
        gap: 0.625rem;
        margin-top: 0.125rem;
        font-size: 0.6875rem;
        color: var(--ion-color-medium);

        span {
          display: flex;
          align-items: center;
          gap: 0.125rem;
        }

        ion-icon {
          font-size: 0.625rem;
        }
      }

      &__rating ion-icon {
        color: #eab308;
      }

      &__distance ion-icon {
        color: var(--ion-color-primary);
      }

      &__status {
        flex-shrink: 0;

        ion-badge {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 0.625rem;

          ion-icon {
            font-size: 0.625rem;
          }
        }
      }

      &__toggle {
        flex-shrink: 0;
        color: var(--ion-color-medium);
        font-size: 1rem;
      }

      &__explanation {
        display: flex;
        align-items: flex-start;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: var(--ion-color-light);
        border-top: 1px solid var(--ion-color-light-shade);
        font-size: 0.75rem;
        color: var(--ion-color-medium);

        ion-icon {
          color: var(--ion-color-primary);
          font-size: 0.875rem;
          flex-shrink: 0;
          margin-top: 1px;
        }

        ion-badge {
          margin-left: auto;
          font-size: 0.5625rem;
        }
      }

      &__content {
        padding: 0.75rem;
        border-top: 1px solid var(--ion-color-light-shade);
      }

      &__manager {
        margin-bottom: 0.75rem;

        &-label {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ion-color-medium);
          margin-bottom: 0.375rem;
        }

        &-info {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem 1rem;
          font-size: 0.8125rem;
        }
      }

      &__no-contact {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        text-align: center;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 1.25rem;
        }

        p {
          margin: 0;
          font-size: 0.8125rem;
        }
      }

      &__no-email {
        display: flex;
        align-items: flex-start;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        background: #fefce8;
        border: 1px solid #fef08a;
        border-radius: 6px;

        ion-icon {
          color: #eab308;
          margin-top: 2px;
        }

        p {
          margin: 0;
          font-size: 0.8125rem;
          color: #854d0e;
        }
      }

      &__searching {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;

        ion-spinner {
          color: var(--ion-color-primary);
        }

        p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--ion-color-medium);
        }
      }

      &__search-btn {
        margin-top: 0.75rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMatchCardComponent {
  match = input.required<OpponentMatch>();
  disabled = input(false);
  isSearching = input(false);
  sendEmail = output<PendingAction>();
  findContact = output<{ teamId: number; team: string; location: string }>();

  expanded = signal(false);
  editableSubject = signal('');
  editableBody = signal('');

  emailPendingAction = computed((): PendingAction => {
    const draft = this.match().emailDraft;
    return {
      type: 'send_email',
      description: `Send email to ${draft?.toName || 'manager'} (${this.match().team.name})`,
      data: draft as unknown as Record<string, unknown>,
    };
  });

  constructor() {
    addIcons({
      starOutline,
      locationOutline,
      informationCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
      searchOutline,
      checkmarkCircleOutline,
      warningOutline,
    });
  }

  toggleExpanded(): void {
    const wasExpanded = this.expanded();
    this.expanded.set(!wasExpanded);

    if (!wasExpanded && this.match().emailDraft) {
      this.editableSubject.set(this.match().emailDraft!.subject);
      this.editableBody.set(this.match().emailDraft!.body);
    }
  }

  onSendEmail(action: PendingAction): void {
    this.sendEmail.emit(action);
    this.expanded.set(false);
  }

  onFindContact(): void {
    const team = this.match().team;
    this.findContact.emit({
      teamId: team.id,
      team: team.name,
      location: `${team.association.city}, ${team.association.state}`,
    });
  }
}
