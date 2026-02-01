import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';

import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { OpponentMatch } from '@hockey-team-scheduler/shared-utilities';
import { EmailDraftFormComponent } from '../email-draft-form/email-draft-form.component';

/**
 * Displays a single opponent match with ranking, team info, and expandable email draft.
 */
@Component({
  selector: 'lib-opponent-match-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    PanelModule,
    ProgressSpinnerModule,
    EmailDraftFormComponent,
  ],
  template: `
    <div
      class="opponent-match-card"
      [class.opponent-match-card--expanded]="expanded()"
    >
      <!-- Card Header -->
      <div class="opponent-match-card__header" (click)="toggleExpanded()">
        <div class="opponent-match-card__rank">
          <span class="opponent-match-card__rank-number">{{
            match().rank
          }}</span>
        </div>

        <div class="opponent-match-card__info">
          <div class="opponent-match-card__team-name">
            {{ match().team.name }}
          </div>
          <div class="opponent-match-card__meta">
            <span class="opponent-match-card__rating">
              <i class="pi pi-star-fill"></i>
              {{ match().team.rating }}
            </span>
            <span class="opponent-match-card__distance">
              <i class="pi pi-map-marker"></i>
              {{ match().distanceMiles }} mi
            </span>
            <span class="opponent-match-card__location">
              {{ match().team.association.city }},
              {{ match().team.association.state }}
            </span>
          </div>
        </div>

        <div class="opponent-match-card__status">
          @if (match().managerStatus === 'found') {
            <p-tag
              value="Contact Found"
              severity="success"
              icon="pi pi-check"
            />
          } @else {
            <p-button
              label="Find Contact"
              icon="pi pi-search"
              size="small"
              variant="outlined"
              [loading]="searching()"
              (click)="onFindContact($event)"
            />
          }
        </div>

        <div class="opponent-match-card__toggle">
          <i
            class="pi"
            [class.pi-chevron-down]="!expanded()"
            [class.pi-chevron-up]="expanded()"
          ></i>
        </div>
      </div>

      <!-- Explanation -->
      <div class="opponent-match-card__explanation">
        <i class="pi pi-info-circle"></i>
        {{ match().explanation }}
        @if (match().alreadyPlayed) {
          <p-tag
            value="Previously Played"
            severity="secondary"
            class="opponent-match-card__played-tag"
          />
        }
      </div>

      <!-- Expanded Content -->
      @if (expanded()) {
        <div class="opponent-match-card__content">
          @if (match().manager && match().emailDraft) {
            <div class="opponent-match-card__manager">
              <h4>Manager Contact</h4>
              <div class="opponent-match-card__manager-info">
                <span
                  ><strong>{{ match().manager?.name }}</strong></span
                >
                <span>{{ match().manager?.email }}</span>
                @if (match().manager?.phone) {
                  <span>{{ match().manager?.phone }}</span>
                }
              </div>
            </div>

            <lib-email-draft-form
              [emailDraft]="match().emailDraft!"
              [pendingAction]="emailPendingAction()"
              [editableSubject]="editableSubject()"
              [editableBody]="editableBody()"
              [disabled]="disabled()"
              [rows]="4"
              (subjectChange)="editableSubject.set($event)"
              (bodyChange)="editableBody.set($event)"
              (confirm)="onSendEmail($event)"
              (decline)="expanded.set(false)"
            />
          } @else if (match().manager && !match().emailDraft) {
            <div class="opponent-match-card__manager">
              <h4>Manager Contact</h4>
              <div class="opponent-match-card__manager-info">
                <span><strong>{{ match().manager?.name }}</strong></span>
                @if (match().manager?.phone) {
                  <span>{{ match().manager?.phone }}</span>
                }
              </div>
            </div>
            <div class="opponent-match-card__no-email">
              <i class="pi pi-exclamation-triangle"></i>
              <p>No email address was found for this contact. You may need to reach out by phone or through their association website.</p>
            </div>
          } @else {
            <div class="opponent-match-card__no-contact">
              @if (searching()) {
                <p-progressSpinner
                  ariaLabel="Searching for contact..."
                  [style]="{ width: '40px', height: '40px' }"
                />
                <p>Searching for contact information...</p>
              } @else {
                <i class="pi pi-info-circle"></i>
                <p>
                  Click "Find Contact" to search for this team's manager contact
                  information.
                </p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .opponent-match-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        overflow: hidden;
        transition: box-shadow 0.2s ease;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        &--expanded {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.15s ease;

          &:hover {
            background: var(--surface-hover);
          }
        }

        &__rank {
          flex-shrink: 0;

          &-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            background: var(--secondary-500);
            color: white;
            border-radius: 50%;
            font-weight: 700;
            font-size: 0.875rem;
          }
        }

        &__info {
          flex: 1;
          min-width: 0;
        }

        &__team-name {
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-color-secondary);

          span {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          i {
            font-size: 0.625rem;
          }
        }

        &__rating i {
          color: var(--yellow-500);
        }

        &__distance i {
          color: var(--primary-400);
        }

        &__status {
          flex-shrink: 0;
        }

        &__toggle {
          flex-shrink: 0;
          color: var(--text-color-secondary);
        }

        &__explanation {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--surface-ground);
          border-top: 1px solid var(--surface-border);
          font-size: 0.8125rem;
          color: var(--text-color-secondary);

          i {
            color: var(--primary-400);
          }
        }

        &__played-tag {
          margin-left: auto;
        }

        &__content {
          padding: 1rem;
          border-top: 1px solid var(--surface-border);
        }

        &__manager {
          margin-bottom: 1rem;

          h4 {
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-color-secondary);
          }

          &-info {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem 1.5rem;
            font-size: 0.875rem;
          }
        }

        &__no-contact {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          text-align: center;
          color: var(--text-color-secondary);

          i {
            font-size: 1.5rem;
            color: var(--surface-400);
          }

          p {
            margin: 0;
            font-size: 0.875rem;
          }
        }

        &__no-email {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--yellow-50);
          border: 1px solid var(--yellow-200);
          border-radius: 6px;
          color: var(--yellow-900);

          i {
            margin-top: 0.125rem;
            color: var(--yellow-500);
          }

          p {
            margin: 0;
            font-size: 0.875rem;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentMatchCardComponent {
  /** The opponent match data */
  match = input.required<OpponentMatch>();

  /** Whether the card inputs are disabled */
  disabled = input(false);

  /** Whether the card is currently searching for contact info */
  searching = input(false);

  /** Emitted when user sends an email for this match */
  sendEmail = output<PendingAction>();

  /** Emitted when user clicks "Find Contact" */
  findContact = output<{ teamId: number; team: string; location: string }>();

  /** Whether the card is expanded */
  expanded = signal(false);

  /** Editable email subject */
  editableSubject = signal('');

  /** Editable email body */
  editableBody = signal('');

  /** Initialize editable fields when match changes */
  constructor() {
    // Initialize editable fields from email draft
  }

  /** Build a pending action for just this email */
  emailPendingAction = computed((): PendingAction => {
    const draft = this.match().emailDraft;
    return {
      type: 'send_email',
      description: `Send email to ${draft?.toName || 'manager'} (${this.match().team.name})`,
      data: draft as unknown as Record<string, unknown>,
    };
  });

  /** Toggle expanded state and initialize editable fields */
  toggleExpanded(): void {
    const wasExpanded = this.expanded();
    this.expanded.set(!wasExpanded);

    // Initialize editable fields when expanding
    if (!wasExpanded && this.match().emailDraft) {
      this.editableSubject.set(this.match().emailDraft!.subject);
      this.editableBody.set(this.match().emailDraft!.body);
    }
  }

  /** Handle send email action */
  onSendEmail(action: PendingAction): void {
    this.sendEmail.emit(action);
    this.expanded.set(false);
  }

  /** Handle find contact click */
  onFindContact(event: Event): void {
    event.stopPropagation();
    const match = this.match();
    this.expanded.set(true);
    this.findContact.emit({
      teamId: match.team.id,
      team: match.team.name,
      location: `${match.team.association.city}, ${match.team.association.state}`,
    });
  }
}
