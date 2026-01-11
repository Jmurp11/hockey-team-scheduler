import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  AssociationInvitation,
  TableOptions,
} from '@hockey-team-scheduler/shared-utilities';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TableComponent } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-invitations-table',
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
      [tableData]="invitations"
      [hasActions]="true"
    >
      <ng-template #body let-invitation>
        <tr>
          <td>{{ invitation.invited_email }}</td>
          <td>
            <p-tag
              [value]="invitation.role"
              [severity]="invitation.role === 'ADMIN' ? 'info' : 'secondary'"
            />
          </td>
          <td>
            <p-tag
              [value]="invitation.status.toUpperCase()"
              [severity]="getStatusSeverity(invitation.status)"
            />
          </td>
          <td>{{ invitation.expires_at | date: 'mediumDate' }}</td>
          <td>
            @if (invitation.status === 'expired') {
              <p-button
                icon="pi pi-refresh"
                label="Resend"
                severity="secondary"
                [text]="true"
                size="small"
                (click)="onResend(invitation)"
              />
            }
            @if (invitation.status === 'pending') {
              <p-button
                icon="pi pi-times"
                severity="danger"
                [text]="true"
                size="small"
                (click)="onCancel(invitation)"
                pTooltip="Cancel invitation"
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
export class InvitationsTableComponent {
  @Input() invitations: AssociationInvitation[] = [];
  @Output() resendInvitation = new EventEmitter<AssociationInvitation>();
  @Output() cancelInvitation = new EventEmitter<AssociationInvitation>();

  tableOpts: TableOptions = {
    columns: [
      { field: 'invited_email', header: 'Email', sortable: true },
      { field: 'role', header: 'Role', sortable: true },
      { field: 'status', header: 'Status', sortable: true },
      { field: 'expires_at', header: 'Expires', sortable: true },
    ],
    globalFilterFields: ['invited_email', 'role', 'status'],
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 25],
    sortField: 'invited_email',
    sortOrder: 1,
    stateStorage: 'session',
    stateKey: 'association-invitations-table',
  };

  constructor(private confirmationService: ConfirmationService) {}

  getStatusSeverity(
    status: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'pending':
        return 'info';
      case 'expired':
        return 'warn';
      case 'canceled':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  onResend(invitation: AssociationInvitation) {
    this.resendInvitation.emit(invitation);
  }

  onCancel(invitation: AssociationInvitation) {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel the invitation for ${invitation.invited_email}?`,
      header: 'Confirm Cancellation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cancelInvitation.emit(invitation);
      },
    });
  }
}
