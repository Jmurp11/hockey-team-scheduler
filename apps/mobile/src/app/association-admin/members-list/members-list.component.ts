import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AssociationMember } from '@hockey-team-scheduler/shared-utilities';
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
import { personRemove } from 'ionicons/icons';

@Component({
  selector: 'app-members-list',
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
    <ion-list class="members-list">
      @for (member of members; track member.id) {
        <ion-item-sliding>
          <ion-item>
            <ion-label>
              <h2>{{ member.user_name || 'Unknown' }}</h2>
              <p>{{ member.user_email }}</p>
            </ion-label>
            <ion-badge slot="end" [color]="getStatusColor(member.status)">
              {{ member.status }}
            </ion-badge>
            <ion-badge slot="end" [color]="member.role === 'ADMIN' ? 'primary' : 'medium'">
              {{ member.role }}
            </ion-badge>
          </ion-item>
          @if (member.role !== 'ADMIN') {
            <ion-item-options side="end">
              <ion-item-option color="danger" (click)="onRemove(member)">
                <ion-icon slot="icon-only" name="person-remove"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          }
        </ion-item-sliding>
      } @empty {
        <ion-item>
          <ion-label class="ion-text-center">
            <p>No members found</p>
          </ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: [`
    .members-list {
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
export class MembersListComponent {
  @Input() members: AssociationMember[] = [];
  @Output() removeMember = new EventEmitter<AssociationMember>();

  constructor(private alertController: AlertController) {
    addIcons({ personRemove });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'primary';
      case 'INACTIVE':
        return 'warning';
      case 'REMOVED':
        return 'danger';
      default:
        return 'medium';
    }
  }

  async onRemove(member: AssociationMember) {
    const alert = await this.alertController.create({
      header: 'Confirm Removal',
      message: `Are you sure you want to remove ${member.user_name || member.user_email} from the association?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.removeMember.emit(member);
          },
        },
      ],
    });

    await alert.present();
  }
}
