import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  EmailDraft,
  PendingAction,
} from '@hockey-team-scheduler/shared-data-access';
import {
  getEmailIntentLabel,
  getEmailIntentSeverity,
  createUpdatedEmailAction,
} from '@hockey-team-scheduler/shared-utilities';

/**
 * Shared email draft form component for web (PrimeNG).
 * Displays email draft details with editable subject/body and action buttons.
 *
 * Used by:
 * - ai-chat-message component (inline email preview)
 * - email-preview component (standalone email preview)
 */
@Component({
  selector: 'lib-email-draft-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    Textarea,
    TagModule,
    TooltipModule,
  ],
  template: `
    <div class="email-draft-form">
      <div class="email-draft-form__header">
        <i class="pi pi-envelope"></i>
        <span>Email Draft</span>
        <p-tag [value]="intentLabel()" [severity]="intentSeverity()" />
      </div>

      <div class="email-draft-form__content">
        <!-- Recipient -->
        <div class="email-draft-form__field">
          <label>To:</label>
          <div class="email-draft-form__recipient">
            <span class="email-draft-form__recipient-name">
              {{ emailDraft().toName }}
            </span>
            <span class="email-draft-form__recipient-team">
              ({{ emailDraft().toTeam }})
            </span>
            <span class="email-draft-form__recipient-email">
              {{ emailDraft().to }}
            </span>
          </div>
        </div>

        <!-- Subject -->
        <div class="email-draft-form__field">
          <label for="email-subject">Subject:</label>
          <input
            pInputText
            id="email-subject"
            [ngModel]="editableSubject()"
            (ngModelChange)="subjectChange.emit($event)"
            class="email-draft-form__input"
            [disabled]="disabled()"
          />
        </div>

        <!-- Body -->
        <div class="email-draft-form__field">
          <label for="email-body">Message:</label>
          <textarea
            pInputTextarea
            id="email-body"
            [ngModel]="editableBody()"
            (ngModelChange)="bodyChange.emit($event)"
            [rows]="rows()"
            [autoResize]="true"
            class="email-draft-form__textarea"
            [disabled]="disabled()"
          ></textarea>
        </div>

        <!-- Signature -->
        <div class="email-draft-form__field">
          <label>Signature:</label>
          <div class="email-draft-form__signature">
            {{ emailDraft().signature }}
          </div>
        </div>
      </div>

      <div class="email-draft-form__actions">
        <p-button
          label="Send Email"
          icon="pi pi-send"
          (click)="onConfirm()"
          [disabled]="disabled()"
          pTooltip="Send this email to the recipient"
          tooltipPosition="top"
        />
        <p-button
          label="Cancel"
          icon="pi pi-times"
          (click)="decline.emit()"
          [disabled]="disabled()"
          pTooltip="Cancel and don't send"
          tooltipPosition="top"
        />
      </div>

      <p class="email-draft-form__disclaimer">
        <i class="pi pi-info-circle"></i>
        This email will be sent from your account. The recipient can reply directly to you.
      </p>
    </div>
  `,
  styles: [
    `
      .email-draft-form {
        background: var(--surface-ground);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        overflow: hidden;

        &__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          background: var(--surface-card);
          border-bottom: 1px solid var(--surface-border);
          font-size: 0.8125rem;
          font-weight: 600;

          i {
            color: var(--primary-500);
          }

          span {
            flex: 1;
          }
        }

        &__content {
          padding: 0.75rem;
        }

        &__field {
          margin-bottom: 0.625rem;

          &:last-child {
            margin-bottom: 0;
          }

          label {
            display: block;
            font-size: 0.6875rem;
            font-weight: 600;
            color: var(--text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
          }
        }

        &__recipient {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;

          &-name {
            font-weight: 600;
          }

          &-team {
            color: var(--text-color-secondary);
          }

          &-email {
            color: var(--primary-500);
            font-size: 0.75rem;
          }
        }

        &__input {
          width: 100%;
          font-size: 0.8125rem !important;
        }

        &__textarea {
          width: 100%;
          font-size: 0.8125rem !important;
          line-height: 1.4;
        }

        &__signature {
          background: var(--surface-card);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          white-space: pre-line;
          font-size: 0.75rem;
          color: var(--text-color-secondary);
          border-left: 2px solid var(--primary-500);
        }

        &__actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          border-top: 1px solid var(--surface-border);
          background: var(--surface-card);
        }

        &__disclaimer {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin: 0;
          padding: 0.5rem 0.75rem;
          font-size: 0.6875rem;
          color: var(--text-color-secondary);
          background: var(--surface-50);

          i {
            color: var(--primary-400);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailDraftFormComponent {
  /** The email draft data to display */
  emailDraft = input.required<EmailDraft>();

  /** The pending action (needed for confirm output) */
  pendingAction = input.required<PendingAction>();

  /** Current editable subject value */
  editableSubject = input('');

  /** Current editable body value */
  editableBody = input('');

  /** Whether inputs are disabled */
  disabled = input(false);

  /** Use compact styling (smaller buttons) */
  compact = input(false);

  /** Number of rows for textarea */
  rows = input(4);

  /** Emitted when subject changes */
  subjectChange = output<string>();

  /** Emitted when body changes */
  bodyChange = output<string>();

  /** Emitted when user confirms sending the email */
  confirm = output<PendingAction>();

  /** Emitted when user declines/cancels */
  decline = output<void>();

  /**
   * Get email intent label for display.
   */
  intentLabel(): string {
    return getEmailIntentLabel(this.emailDraft().intent);
  }

  /**
   * Get email intent severity for tag styling.
   */
  intentSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severity = getEmailIntentSeverity(this.emailDraft().intent);
    return severity === 'warning' ? 'warn' : severity;
  }

  /**
   * Handle confirm button click.
   * Creates updated action with edited subject/body.
   */
  onConfirm(): void {
    const updatedAction = createUpdatedEmailAction(
      this.pendingAction(),
      this.editableSubject(),
      this.editableBody()
    );
    this.confirm.emit(updatedAction);
  }
}
