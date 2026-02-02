import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonChip,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sendOutline,
  mailOutline,
  closeOutline,
  informationCircleOutline,
} from 'ionicons/icons';

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
 * Mobile email draft form component (Ionic).
 * Displays email draft details with editable subject/body and action buttons.
 *
 * Used by:
 * - ai-chat-message component (inline email preview)
 * - email-preview component (standalone email preview)
 */
@Component({
  selector: 'app-email-draft-form',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonChip,
    IonText,
  ],
  template: `
    <div class="email-draft-form">
      <div class="email-draft-form__header">
        <ion-icon name="mail-outline"></ion-icon>
        <span>Email Draft</span>
        <ion-chip [color]="intentColor()" size="small">
          {{ intentLabel() }}
        </ion-chip>
      </div>

      <div class="email-draft-form__content">
        <!-- Recipient -->
        <ion-item lines="none" class="email-draft-form__field">
          <ion-label position="stacked">To</ion-label>
          <ion-text>
            <strong>{{ emailDraft().toName }}</strong>
            ({{ emailDraft().toTeam }})
            <br />
            <small>{{ emailDraft().to }}</small>
          </ion-text>
        </ion-item>

        <!-- Subject -->
        <ion-item lines="none" class="email-draft-form__field">
          <ion-label position="stacked">Subject</ion-label>
          <ion-input
            [ngModel]="editableSubject()"
            (ngModelChange)="subjectChange.emit($event)"
            [disabled]="disabled()"
          ></ion-input>
        </ion-item>

        <!-- Body -->
        <ion-item lines="none" class="email-draft-form__field">
          <ion-label position="stacked">Message</ion-label>
          <ion-textarea
            [ngModel]="editableBody()"
            (ngModelChange)="bodyChange.emit($event)"
            [autoGrow]="true"
            [rows]="rows()"
            [disabled]="disabled()"
          ></ion-textarea>
        </ion-item>

        <!-- Signature -->
        <ion-item lines="none" class="email-draft-form__field">
          <ion-label position="stacked">Signature</ion-label>
          <ion-text class="email-draft-form__signature">
            {{ emailDraft().signature }}
          </ion-text>
        </ion-item>
      </div>

      <div class="email-draft-form__actions">
        <ion-button
          color="secondary"
          [size]="compact() ? 'small' : 'default'"
          (click)="onConfirm()"
          [disabled]="disabled()"
        >
          <ion-icon slot="start" name="send-outline"></ion-icon>
          Send Email
        </ion-button>
        <ion-button
          color="secondary"
          fill="outline"
          [size]="compact() ? 'small' : 'default'"
          (click)="decline.emit()"
          [disabled]="disabled()"
        >
          <ion-icon slot="start" name="close-outline"></ion-icon>
          Cancel
        </ion-button>
      </div>

      <p class="email-draft-form__disclaimer">
        <ion-icon name="information-circle-outline"></ion-icon>
        This email will be sent from your account.
      </p>
    </div>
  `,
  styles: [
    `
      .email-draft-form {
        background: var(--ion-color-light-tint);
        border-radius: 8px;
        overflow: hidden;

        &__header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--ion-color-light);
          font-size: 0.8125rem;
          font-weight: 600;

          ion-icon {
            color: var(--ion-color-primary);
          }

          span {
            flex: 1;
          }
        }

        &__content {
          padding: 8px;
        }

        &__field {
          --padding-start: 0;
          --inner-padding-end: 0;
          margin-bottom: 8px;

          ion-label {
            font-size: 0.6875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--ion-color-medium);
          }
        }

        &__signature {
          background: var(--ion-color-light);
          padding: 8px 12px;
          border-radius: 4px;
          white-space: pre-line;
          font-size: 0.75rem;
          color: var(--ion-color-medium);
          border-left: 2px solid var(--ion-color-primary);
          display: block;
          margin-top: 4px;
        }

        &__actions {
          display: flex;
          gap: 8px;
          padding: 8px 12px;
          border-top: 1px solid var(--ion-color-light-shade);
        }

        &__disclaimer {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
          padding: 8px 12px;
          font-size: 0.6875rem;
          color: var(--ion-color-medium);
          background: var(--ion-color-light);

          ion-icon {
            color: var(--ion-color-primary);
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

  constructor() {
    addIcons({
      sendOutline,
      mailOutline,
      closeOutline,
      informationCircleOutline,
    });
  }

  /**
   * Get email intent label for display.
   */
  intentLabel(): string {
    return getEmailIntentLabel(this.emailDraft().intent);
  }

  /**
   * Get email intent color for chip.
   */
  intentColor(): string {
    const severity = getEmailIntentSeverity(this.emailDraft().intent);
    const colorMap: Record<string, string> = {
      success: 'success',
      warning: 'warning',
      danger: 'danger',
      info: 'primary',
    };
    return colorMap[severity] || 'medium';
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
