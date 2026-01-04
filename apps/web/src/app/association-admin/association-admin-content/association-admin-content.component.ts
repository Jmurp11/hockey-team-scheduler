import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import {
  AssociationInvitation,
  AssociationMember,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { InviteMemberDialogService } from '../invite-member/invite-member-dialog.service';
import { MembersTableComponent } from '../members-table/members-table.component';
import { InvitationsTableComponent } from '../invitations-table/invitations-table.component';

@Component({
  selector: 'app-association-admin-content',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TabsModule,
    BadgeModule,
    MembersTableComponent,
    InvitationsTableComponent,
  ],
  template: `
    <div class="admin-content">
      <div class="admin-content__header">
        <p-button
          icon="pi pi-user-plus"
          label="Invite Member"
          size="small"
          (click)="openInviteDialog()"
        />
      </div>

      <p-tabs [value]="activeTab()" (valueChange)="onTabChange($event)">
        <p-tablist>
          <p-tab [value]="0">
            <span class="tab-label">
              <i class="pi pi-users"></i>
              Members
              <p-badge [value]="members.length.toString()" severity="secondary" />
            </span>
          </p-tab>
          <p-tab [value]="1">
            <span class="tab-label">
              <i class="pi pi-envelope"></i>
              Invitations
              @if (pendingInvitationsCount > 0) {
                <p-badge [value]="pendingInvitationsCount.toString()" severity="warn" />
              } @else {
                <p-badge [value]="invitations.length.toString()" severity="secondary" />
              }
            </span>
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel [value]="0">
            <app-members-table
              [members]="members"
              (removeMember)="removeMember.emit($event)"
            />
          </p-tabpanel>

          <p-tabpanel [value]="1">
            <app-invitations-table
              [invitations]="invitations"
              (resendInvitation)="resendInvitation.emit($event)"
              (cancelInvitation)="cancelInvitation.emit($event)"
            />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: [
    `
      .admin-content {
        padding: 1.5rem 2rem;

        &__header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1rem;
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          i {
            font-size: 1rem;
          }
        }
      }

      ::ng-deep {
        .p-tabs {
          .p-tablist {
            border-bottom: 1px solid var(--surface-200);
          }

          .p-tabpanels {
            padding: 1rem 0;
          }
        }
      }

      @media (max-width: 768px) {
        .admin-content {
          padding: 1rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationAdminContentComponent {
  private inviteMemberDialogService = inject(InviteMemberDialogService);

  @Input() members: AssociationMember[] = [];
  @Input() invitations: AssociationInvitation[] = [];
  @Input() subscriptionId: string = '';

  @Output() removeMember = new EventEmitter<AssociationMember>();
  @Output() inviteMember = new EventEmitter<void>();
  @Output() resendInvitation = new EventEmitter<AssociationInvitation>();
  @Output() cancelInvitation = new EventEmitter<AssociationInvitation>();

  activeTab = signal(0);

  get pendingInvitationsCount(): number {
    return this.invitations.filter((i) => i.status === 'pending').length;
  }

  onTabChange(value: string | number | undefined): void {
    if (typeof value === 'number') {
      this.activeTab.set(value);
    }
  }

  openInviteDialog() {
    this.inviteMemberDialogService.openDialog(this.subscriptionId);
  }
}

