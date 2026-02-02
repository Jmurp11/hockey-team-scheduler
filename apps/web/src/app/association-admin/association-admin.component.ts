import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AssociationAdminService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  AssociationAdminData,
  AssociationInvitation,
  AssociationMember,
  isUserAdmin,
} from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { filter, switchMap } from 'rxjs';
import { AssociationAdminContentComponent } from './association-admin-content/association-admin-content.component';
import { AssociationAdminHeaderComponent } from './association-admin-header/association-admin-header.component';
import { InviteMemberDialogService } from './invite-member/invite-member-dialog.service';

@Component({
  selector: 'app-association-admin',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    ToastModule,
    AssociationAdminHeaderComponent,
    AssociationAdminContentComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="association-admin">
      @if (loading()) {
        <div class="loading-container">
          <p-progressSpinner />
        </div>
      } @else if (adminData()) {
        <app-association-admin-header
          [associationName]="adminData()!.associationName"
          [adminName]="currentUser()?.display_name || ''"
          [subscriptionStatus]="adminData()!.subscription?.status || 'N/A'"
          [subscriptionEndDate]="
            adminData()!.subscription?.current_period_end || null
          "
          [seatsInUse]="adminData()!.subscription?.seats_in_use || 0"
          [totalSeats]="adminData()!.subscription?.total_seats || 0"
        />
        <app-association-admin-content
          [members]="adminData()!.members"
          [invitations]="adminData()!.invitations"
          [subscriptionId]="adminData()!.subscription?.id || ''"
          (removeMember)="onRemoveMember($event)"
          (updateMemberRole)="onUpdateMemberRole($event)"
          (resendInvitation)="onResendInvitation($event)"
          (cancelInvitation)="onCancelInvitation($event)"
        />
      } @else {
        <div class="error-container">
          <p>Unable to load association data. Please try again.</p>
        </div>
      }
    </div>
    <p-toast />
  `,
  styles: [
    `
      .association-admin {
        min-height: 100%;
        background: var(--surface-ground);
      }

      .loading-container,
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
      }

      .error-container {
        color: var(--text-color-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AssociationAdminService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private inviteMemberDialogService = inject(InviteMemberDialogService);
  private viewContainerRef = inject(ViewContainerRef);

  currentUser = this.authService.currentUser;
  loading = signal(true);
  adminData = signal<AssociationAdminData | null>(null);

  destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.inviteMemberDialogService.setViewContainerRef(this.viewContainerRef);
    
    // Subscribe to invitation sent events
    this.inviteMemberDialogService.invitationSent$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onInvitationSent());
    
    const user = this.currentUser();

    // Check if user is an admin
    if (!user || !isUserAdmin(user.role)) {
      this.router.navigate(['/app/profile']);
      return;
    }

    this.loadAdminData(user.association_id.toString());
  }

  private loadAdminData(associationId: string) {
    this.loading.set(true);
    this.adminService
      .getAssociationAdminData(associationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.adminData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading admin data:', err);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load association data',
          });
        },
      });
  }

  onRemoveMember(member: AssociationMember) {
    this.adminService
      .removeMember(member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Member removed successfully',
          });
          // Reload data
          const user = this.currentUser();
          if (user) {
            this.loadAdminData(user.association_id.toString());
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to remove member',
          });
        },
      });
  }

  onUpdateMemberRole(event: { member: AssociationMember; role: 'ADMIN' | 'MANAGER' }) {
    this.adminService
      .updateMemberRole(event.member.id, event.role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Member role updated to ${event.role}`,
          });
          // Reload data
          const user = this.currentUser();
          if (user) {
            this.loadAdminData(user.association_id.toString());
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update member role',
          });
        },
      });
  }

  onResendInvitation(invitation: AssociationInvitation) {
    this.adminService
      .resendInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Invitation resent successfully',
            });
            // Reload data
            const user = this.currentUser();
            if (user) {
              this.loadAdminData(user.association_id.toString());
            }
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to resend invitation',
          });
        },
      });
  }

  onCancelInvitation(invitation: AssociationInvitation) {
    this.adminService
      .cancelInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Invitation cancelled successfully',
          });
          // Reload data
          const user = this.currentUser();
          if (user) {
            this.loadAdminData(user.association_id.toString());
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to cancel invitation',
          });
        },
      });
  }

  onInvitationSent() {
    // Reload data to show new invitation
    const user = this.currentUser();
    if (user) {
      this.loadAdminData(user.association_id.toString());
    }
  }
}
