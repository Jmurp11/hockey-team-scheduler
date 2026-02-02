import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AssociationAdminService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';
import { prepareInvitationRequest } from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { InviteMemberDialogService } from './invite-member-dialog.service';

@Component({
  selector: 'app-invite-member',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    InputComponent,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <form [formGroup]="inviteForm">
      <app-dialog [visible]="inviteMemberDialogService.isVisible()">
        <ng-template #header>
          <div class="dialog-header">
            <h2>Invite New Member</h2>
          </div>
        </ng-template>

        <div class="invite-form">
          <app-input
            class="invite-form__field"
            [control]="nameControl"
            label="Name"
          />
          <app-input
            class="invite-form__field"
            [control]="emailControl"
            label="Email"
          />
        </div>

        <ng-template #footer>
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="cancel()"
          />
          <p-button
            label="Send Invitation"
            [disabled]="inviteForm.invalid || sending"
            [loading]="sending"
            (click)="submit()"
          />
        </ng-template>
      </app-dialog>
    </form>
    <p-toast />
  `,
  styles: [`
    .dialog-header {
      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-500);
      }
    }

    .invite-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
      min-width: 350px;

      &__field {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteMemberComponent implements OnInit {
  @Input() subscriptionId: string = '';
  @Output() invitationSent = new EventEmitter<void>();

  inviteMemberDialogService = inject(InviteMemberDialogService);
  private authService = inject(AuthService);
  private adminService = inject(AssociationAdminService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  inviteForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  sending = false;

  get nameControl(): FormControl {
    return this.inviteForm.get('name') as FormControl;
  }

  get emailControl(): FormControl {
    return this.inviteForm.get('email') as FormControl;
  }

  ngOnInit(): void {
    // Reset form when dialog opens
    this.inviteForm.reset();
  }

  cancel(): void {
    this.inviteForm.reset();
    this.inviteMemberDialogService.closeDialog();
  }

  submit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User not authenticated',
      });
      return;
    }

    this.sending = true;

    const invitationData = prepareInvitationRequest(
      { name: this.nameControl.value!, email: this.emailControl.value! },
      this.subscriptionId,
      user.association_id.toString(),
      user.user_id
    );

    this.adminService
      .createInvitation(invitationData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.sending = false;
          const email = this.emailControl.value;
          if (result.emailSent) {
            this.messageService.add({
              severity: 'success',
              summary: 'Invitation Sent',
              detail: `Invitation email sent to ${email}`,
            });
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: `Invitation created for ${email} but email failed to send`,
            });
          }
          this.inviteForm.reset();
          this.inviteMemberDialogService.closeDialog();
          this.invitationSent.emit();
        },
        error: (err) => {
          this.sending = false;
          console.error('Error sending invitation:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to send invitation',
          });
        },
      });
  }
}
