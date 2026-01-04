import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
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
import { TableComponent } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-members-table',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
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
          <td>
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
          </td>
        </tr>
      </ng-template>
    </app-table>
    <p-confirmDialog />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersTableComponent {
  @Input() members: AssociationMember[] = [];
  @Output() removeMember = new EventEmitter<AssociationMember>();

  tableOpts: TableOptions = {
    columns: [
      { field: 'user_name', header: 'Name', sortable: true },
      { field: 'user_email', header: 'Email', sortable: true },
      { field: 'role', header: 'Role', sortable: true },
      { field: 'status', header: 'Status', sortable: true },
    ],
    globalFilterFields: ['user_name', 'user_email', 'role', 'status'],
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
