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
  IonToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personRemove, shieldCheckmark } from 'ionicons/icons';

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
    IonToggle,
  ],
  template: `
    <ion-list class="members-list">
      @for (member of members; track member.id) {
        <ion-item-sliding>
          <ion-item>
            <ion-label>
              <h2>{{ member.user_name || 'Unknown' }}</h2>
              <p>{{ member.user_email }}</p>
              <p class="team-name">
                {{ member.team_name || 'No team assigned' }}
              </p>
            </ion-label>
            <div slot="end" class="member-controls">
              <ion-toggle
                [checked]="member.role === 'ADMIN'"
                (ionChange)="onToggleAdmin(member, $event)"
                labelPlacement="stacked"
                class="admin-toggle"
              >
                Admin
              </ion-toggle>
              <ion-badge [color]="getStatusColor(member.status)">
                {{ member.status }}
              </ion-badge>
            </div>
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
  styles: [
    `
      .members-list {
        margin: 0;
        padding: 0;
        border-radius: 8px;
        overflow: hidden;
      }

      .member-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .admin-toggle {
        --track-background: var(--ion-color-medium);
        --track-background-checked: var(--ion-color-primary);
      }

      ion-badge {
        margin-left: 0.5rem;
      }

      .team-name {
        font-size: 0.8rem;
        color: var(--ion-color-primary);
        font-style: italic;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersListComponent {
  @Input() members: AssociationMember[] = [];
  @Output() removeMember = new EventEmitter<AssociationMember>();
  @Output() updateMemberRole = new EventEmitter<{
    member: AssociationMember;
    role: 'ADMIN' | 'MANAGER';
  }>();

  constructor(private alertController: AlertController) {
    addIcons({ personRemove, shieldCheckmark });
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

  async onToggleAdmin(member: AssociationMember, event: any) {
    const toggle = event.target;
    const newRole = event.detail.checked ? 'ADMIN' : 'MANAGER';
    const action = event.detail.checked ? 'promote' : 'demote';
    const roleLabel = event.detail.checked ? 'an admin' : 'a regular member';

    const alert = await this.alertController.create({
      header: 'Confirm Role Change',
      message: `Are you sure you want to ${action} ${member.user_name || member.user_email} to ${roleLabel}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: () => {
            this.updateMemberRole.emit({ member, role: newRole });
          },
        },
      ],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    if (role === 'cancel' || role === 'backdrop') {
      // Revert the toggle to its original state
      toggle.checked = member.role === 'ADMIN';
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
