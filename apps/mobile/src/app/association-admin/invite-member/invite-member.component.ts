import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
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
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonModal,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { InputComponent } from '../../shared/input/input.component';
import { InviteMemberModalService } from './invite-member-modal.service';

@Component({
  selector: 'app-invite-member',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    InputComponent,
  ],
  template: `
    <ion-modal
      [isOpen]="inviteMemberModalService.isOpen()"
      (didDismiss)="cancel()"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Invite New Member</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="cancel()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <form [formGroup]="inviteForm">
            <ion-item lines="none">
              <app-input
                class="form-field"
                type="text"
                label="Name"
                labelPlacement="stacked"
                fill="outline"
                [formControl]="nameControl"
              />
            </ion-item>

            <ion-item lines="none">
              <app-input
                class="form-field"
                type="email"
                label="Email"
                labelPlacement="stacked"
                fill="outline"
                [formControl]="emailControl"
              />
            </ion-item>

            <div class="button-group">
              <ion-button
                expand="block"
                color="medium"
                fill="outline"
                (click)="cancel()"
              >
                Cancel
              </ion-button>
              <ion-button
                expand="block"
                [disabled]="inviteForm.invalid || sending()"
                (click)="submit()"
              >
                @if (sending()) {
                  Sending...
                } @else {
                  Send Invitation
                }
              </ion-button>
            </div>
          </form>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .form-field {
      width: 100%;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 1rem;
    }

    .button-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 2rem;

      ion-button {
        margin: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteMemberComponent implements OnInit {
  @Input() subscriptionId: string = '';
  @Output() invitationSent = new EventEmitter<void>();

  inviteMemberModalService = inject(InviteMemberModalService);
  private authService = inject(AuthService);
  private adminService = inject(AssociationAdminService);
  private toastController = inject(ToastController);

  inviteForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  sending = signal(false);

  get nameControl(): FormControl {
    return this.inviteForm.get('name') as FormControl;
  }

  get emailControl(): FormControl {
    return this.inviteForm.get('email') as FormControl;
  }

  ngOnInit(): void {
    this.inviteForm.reset();
  }

  cancel(): void {
    this.inviteForm.reset();
    this.inviteMemberModalService.closeModal();
  }

  async submit(): Promise<void> {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      await this.showToast('User not authenticated', 'danger');
      return;
    }

    this.sending.set(true);

    this.adminService
      .createInvitation({
        subscriptionId: this.subscriptionId,
        associationId: user.association_id.toString(),
        email: this.emailControl.value!,
        role: 'MANAGER',
        inviter_user_id: user.user_id,
      })
      .subscribe({
        next: async (result) => {
          this.sending.set(false);
          const email = this.emailControl.value;
          if (result.emailSent) {
            await this.showToast(`Invitation email sent to ${email}`, 'success');
          } else {
            await this.showToast(
              `Invitation created for ${email} but email failed to send`,
              'warning'
            );
          }
          this.inviteForm.reset();
          this.inviteMemberModalService.closeModal();
          this.invitationSent.emit();
        },
        error: async (err) => {
          this.sending.set(false);
          console.error('Error sending invitation:', err);
          await this.showToast(
            err.error?.message || 'Failed to send invitation',
            'danger'
          );
        },
      });
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
