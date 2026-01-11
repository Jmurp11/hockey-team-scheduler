import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AssociationInvitation } from '@hockey-team-scheduler/shared-utilities';
import {
  AlertController,
  IonBadge,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refresh, close } from 'ionicons/icons';

@Component({
  selector: 'app-invitations-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonBadge,
    IonIcon,
  ],
  template: `
    <ion-list class="invitations-list">
      @for (invitation of invitations; track invitation.id) {
        <ion-item-sliding>
          <ion-item>
            <ion-label>
              <h2>{{ invitation.invited_email }}</h2>
              <p>Expires: {{ invitation.expires_at | date:'mediumDate' }}</p>
            </ion-label>
            <ion-badge slot="end" [color]="getStatusColor(invitation.status)">
              {{ invitation.status }}
            </ion-badge>
            <ion-badge slot="end" [color]="invitation.role === 'ADMIN' ? 'primary' : 'medium'">
              {{ invitation.role }}
            </ion-badge>
          </ion-item>
          <ion-item-options side="end">
            @if (invitation.status === 'expired') {
              <ion-item-option color="primary" (click)="onResend(invitation)">
                <ion-icon slot="icon-only" name="refresh"></ion-icon>
              </ion-item-option>
            }
            @if (invitation.status === 'pending') {
              <ion-item-option color="danger" (click)="onCancel(invitation)">
                <ion-icon slot="icon-only" name="close"></ion-icon>
              </ion-item-option>
            }
          </ion-item-options>
        </ion-item-sliding>
      } @empty {
        <ion-item>
          <ion-label class="ion-text-center">
            <p>No pending invitations</p>
          </ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: [`
    .invitations-list {
      margin: 0;
      padding: 0;
      border-radius: 8px;
      overflow: hidden;
    }

    ion-badge {
      margin-left: 0.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationsListComponent {
  @Input() invitations: AssociationInvitation[] = [];
  @Output() resendInvitation = new EventEmitter<AssociationInvitation>();
  @Output() cancelInvitation = new EventEmitter<AssociationInvitation>();

  constructor(private alertController: AlertController) {
    addIcons({ refresh, close });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'pending':
        return 'primary';
      case 'expired':
        return 'warning';
      case 'canceled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  onResend(invitation: AssociationInvitation) {
    this.resendInvitation.emit(invitation);
  }

  async onCancel(invitation: AssociationInvitation) {
    const alert = await this.alertController.create({
      header: 'Confirm Cancellation',
      message: `Are you sure you want to cancel the invitation for ${invitation.invited_email}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          role: 'destructive',
          handler: () => {
            this.cancelInvitation.emit(invitation);
          },
        },
      ],
    });

    await alert.present();
  }
}
