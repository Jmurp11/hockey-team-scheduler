import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import {
  AssociationInvitation,
  AssociationMember,
  getPendingInvitationsCount,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonBadge,
  IonIcon,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, mail } from 'ionicons/icons';
import { MembersListComponent } from '../members-list/members-list.component';
import { InvitationsListComponent } from '../invitations-list/invitations-list.component';

@Component({
  selector: 'app-association-admin-content',
  standalone: true,
  imports: [
    CommonModule,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonIcon,
    MembersListComponent,
    InvitationsListComponent,
  ],
  template: `
    <div class="admin-content">
      <ion-segment [value]="activeTab()" (ionChange)="onSegmentChange($event)">
        <ion-segment-button value="members">
          <div class="segment-label">
            <ion-icon name="people"></ion-icon>
            <span>Members</span>
            <ion-badge color="medium">{{ members.length }}</ion-badge>
          </div>
        </ion-segment-button>
        <ion-segment-button value="invitations">
          <div class="segment-label">
            <ion-icon name="mail"></ion-icon>
            <span>Invitations</span>
            <ion-badge [color]="pendingInvitationsCount > 0 ? 'warning' : 'medium'">
              {{ invitations.length }}
            </ion-badge>
          </div>
        </ion-segment-button>
      </ion-segment>

      @if (activeTab() === 'members') {
        <app-members-list
          [members]="members"
          (removeMember)="removeMember.emit($event)"
          (updateMemberRole)="updateMemberRole.emit($event)"
        />
      }

      @if (activeTab() === 'invitations') {
        <app-invitations-list
          [invitations]="invitations"
          (resendInvitation)="resendInvitation.emit($event)"
          (cancelInvitation)="cancelInvitation.emit($event)"
        />
      }
    </div>
  `,
  styles: [`
    .admin-content {
      padding: 1rem;
    }

    ion-segment {
      margin-bottom: 1rem;
    }

    .segment-label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;

      ion-icon {
        font-size: 1rem;
      }

      ion-badge {
        font-size: 0.7rem;
        padding: 2px 6px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationAdminContentComponent {
  @Input() members: AssociationMember[] = [];
  @Input() invitations: AssociationInvitation[] = [];

  @Output() removeMember = new EventEmitter<AssociationMember>();
  @Output() updateMemberRole = new EventEmitter<{ member: AssociationMember; role: 'ADMIN' | 'MANAGER' }>();
  @Output() resendInvitation = new EventEmitter<AssociationInvitation>();
  @Output() cancelInvitation = new EventEmitter<AssociationInvitation>();

  activeTab = signal<'members' | 'invitations'>('members');

  constructor() {
    addIcons({ people, mail });
  }

  get pendingInvitationsCount(): number {
    return getPendingInvitationsCount(this.invitations);
  }

  onSegmentChange(event: any): void {
    this.activeTab.set(event.detail.value);
  }
}
