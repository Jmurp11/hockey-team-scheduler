import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  OnInit,
} from '@angular/core';
import {
  EmailDraft,
  PendingAction,
} from '@hockey-team-scheduler/shared-data-access';
import { EmailDraftFormComponent } from '@hockey-team-scheduler/shared-ui';

/**
 * Email preview wrapper component for the RinkLinkGPT chat.
 * Uses the shared EmailDraftFormComponent for consistent UI.
 */
@Component({
  selector: 'app-email-preview',
  standalone: true,
  imports: [EmailDraftFormComponent],
  template: `
    <div class="email-preview-wrapper">
      <lib-email-draft-form
        [emailDraft]="emailDraft()"
        [pendingAction]="pendingAction()"
        [editableSubject]="subject()"
        [editableBody]="body()"
        [disabled]="disabled()"
        [rows]="6"
        (subjectChange)="subject.set($event)"
        (bodyChange)="body.set($event)"
        (confirm)="confirm.emit($event)"
        (decline)="decline.emit()"
      />
    </div>
  `,
  styles: [
    `
      .email-preview-wrapper {
        margin-top: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailPreviewComponent implements OnInit {
  pendingAction = input.required<PendingAction>();
  disabled = input(false);

  confirm = output<PendingAction>();
  decline = output<void>();

  // Editable fields
  subject = model('');
  body = model('');

  ngOnInit(): void {
    const draft = this.emailDraft();
    this.subject.set(draft.subject);
    this.body.set(draft.body);
  }

  emailDraft(): EmailDraft {
    return this.pendingAction().data as EmailDraft;
  }
}
