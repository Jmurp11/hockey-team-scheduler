import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import {
  AssociationMember,
  TableOptions,
} from '@hockey-team-scheduler/shared-utilities';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { TableComponent } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-members-table',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    FormsModule,
    TableComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-table
      [tableOpts]="tableOpts"
      [tableData]="members"
      [hasActions]="true"
    >
      <ng-template #body let-member>
        <tr>
          <td>{{ member.user_name || 'N/A' }}</td>
          <td>{{ member.user_email || 'N/A' }}</td>
          <td>{{ member.team_name || 'N/A' }}</td>
          <td>
            <p-tag
              [value]="member.role"
              [severity]="member.role === 'ADMIN' ? 'info' : 'secondary'"
            />
          </td>
          <td>
            <p-tag
              [value]="member.status"
              [severity]="getStatusSeverity(member.status)"
            />
          </td>
          <td class="actions-cell">
            <div class="actions-container">
              <div class="admin-toggle" pTooltip="Toggle Admin Role">
                <p-toggleswitch
                  [ngModel]="member.role === 'ADMIN'"
                  (onChange)="onToggleAdmin(member, $event)"
                />
                <span class="toggle-label">Admin</span>
              </div>
              @if (member.role !== 'ADMIN') {
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  size="small"
                  (click)="onRemove(member)"
                  pTooltip="Remove member"
                />
              }
            </div>
          </td>
        </tr>
      </ng-template>
    </app-table>
    <p-confirmDialog />
  `,
  styles: [`
    .actions-cell {
      min-width: 180px;
    }

    .actions-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .admin-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toggle-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersTableComponent {
  private cdr = inject(ChangeDetectorRef);

  @Input() members: AssociationMember[] = [];
  @Output() removeMember = new EventEmitter<AssociationMember>();
  @Output() updateMemberRole = new EventEmitter<{ member: AssociationMember; role: 'ADMIN' | 'MANAGER' }>();

  // Track pending toggle to handle revert on cancel
  private pendingToggleMemberId: string | null = null;

  tableOpts: TableOptions = {
    columns: [
      { field: 'user_name', header: 'Name', sortable: true },
      { field: 'user_email', header: 'Email', sortable: true },
      { field: 'team_name', header: 'Team', sortable: true },
      { field: 'role', header: 'Role', sortable: true },
      { field: 'status', header: 'Status', sortable: true },
    ],
    globalFilterFields: ['user_name', 'user_email', 'team_name', 'role', 'status'],
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 25],
    sortField: 'user_name',
    sortOrder: 1,
    stateStorage: 'session',
    stateKey: 'association-members-table',
  };

  constructor(private confirmationService: ConfirmationService) {}

  getStatusSeverity(
    status: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'info';
      case 'INACTIVE':
        return 'warn';
      case 'REMOVED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  onToggleAdmin(member: AssociationMember, event: any) {
    const newRole = event.checked ? 'ADMIN' : 'MANAGER';
    const action = event.checked ? 'promote' : 'demote';
    const roleLabel = event.checked ? 'an admin' : 'a regular member';
    this.pendingToggleMemberId = member.id;

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action} ${member.user_name || member.user_email} to ${roleLabel}?`,
      header: 'Confirm Role Change',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: event.checked ? 'p-button-primary' : 'p-button-warning',
      accept: () => {
        this.pendingToggleMemberId = null;
        this.updateMemberRole.emit({ member, role: newRole });
      },
      reject: () => {
        // Revert the toggle by forcing change detection
        this.pendingToggleMemberId = null;
        // Temporarily mutate to trigger ngModel update, then restore
        const originalRole = member.role;
        member.role = newRole; // Set to the toggled value
        this.cdr.detectChanges();
        member.role = originalRole; // Restore original
        this.cdr.detectChanges();
      },
    });
  }

  onRemove(member: AssociationMember) {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${member.user_name || member.user_email} from the association?`,
      header: 'Confirm Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.removeMember.emit(member);
      },
    });
  }
}