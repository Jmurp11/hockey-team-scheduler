import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  OnInit,
} from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import {
  EmailDraft,
  PendingAction,
} from '@hockey-team-scheduler/shared-data-access';
import { EmailDraftFormComponent } from '../../../shared/components/email-draft-form/email-draft-form.component';

/**
 * Email preview wrapper component for the mobile RinkLinkGPT chat.
 * Uses the shared EmailDraftFormComponent for consistent UI.
 */
@Component({
  selector: 'app-email-preview',
  standalone: true,
  imports: [IonCard, IonCardContent, EmailDraftFormComponent],
  template: `
    <ion-card class="email-preview-wrapper">
      <ion-card-content>
        <app-email-draft-form
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
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .email-preview-wrapper {
      margin: 1rem 0;
      border-radius: 12px;

      ion-card-content {
        padding: 0;
      }
    }
  `],
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
