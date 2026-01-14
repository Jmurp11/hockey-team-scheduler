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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AssociationAdminService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  AssociationAdminData,
  AssociationInvitation,
  AssociationMember,
} from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
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
    if (!user || user.role !== 'ADMIN') {
      this.router.navigate(['/app/profile']);
      return;
    }

    // Initial load of data
    this.loadAdminData(user.association_id.toString());
    
    // Subscribe to real-time changes for members and invitations
    this.subscribeToRealtimeUpdates(user.association_id.toString());
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

  private subscribeToRealtimeUpdates(associationId: string) {
    // Subscribe to member changes
    this.adminService
      .realtimeMembers$(associationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.handleMemberChange(event);
        },
        error: (err) => {
          console.error('Error subscribing to member updates:', err);
        },
      });

    // Subscribe to invitation changes
    this.adminService
      .realtimeInvitations$(associationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.handleInvitationChange(event);
        },
        error: (err) => {
          console.error('Error subscribing to invitation updates:', err);
        },
      });
  }

  private handleMemberChange(event: { type: string; record: AssociationMember & Record<string, unknown> }) {
    const currentData = this.adminData();
    if (!currentData) return;

    const shouldRemove = event.type === 'DELETE' || event.record['status'] === 'REMOVED';
    const updatedMembers = shouldRemove
      ? this.removeMemberFromList(currentData.members, event.record['id'] as string)
      : this.addOrUpdateMember(currentData.members, event.record);

    this.adminData.set({
      ...currentData,
      members: updatedMembers,
    });
  }

  private removeMemberFromList(members: AssociationMember[], recordId: string): AssociationMember[] {
    return members.filter((m) => m.id !== recordId);
  }

  private addOrUpdateMember(
    members: AssociationMember[],
    record: AssociationMember & Record<string, unknown>
  ): AssociationMember[] {
    const transformedMember = this.transformToAssociationMember(record);
    const memberIndex = members.findIndex((m) => m.id === transformedMember.id);

    const updatedMembers = [...members];
    if (memberIndex >= 0) {
      updatedMembers[memberIndex] = { ...updatedMembers[memberIndex], ...transformedMember };
    } else {
      updatedMembers.push(transformedMember);
    }

    return updatedMembers;
  }

  private transformToAssociationMember(record: Record<string, unknown>): AssociationMember {
    return {
      id: record['id'] as string,
      user_id: record['user_id'] as string,
      association: record['association'] as string,
      role: (record['role'] as 'ADMIN' | 'MANAGER') || 'MANAGER',
      status: (record['status'] as 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REMOVED') || 'PENDING',
      created_at: record['created_at'] as string,
    };
  }

  private handleInvitationChange(event: { type: string; record: AssociationInvitation & Record<string, unknown> }) {
    const currentData = this.adminData();
    if (!currentData) return;

    const shouldRemove = event.type === 'DELETE' || event.record['status'] === 'canceled';
    const updatedInvitations = shouldRemove
      ? this.removeInvitationFromList(currentData.invitations, event.record['id'] as string)
      : this.addOrUpdateInvitation(currentData.invitations, event.record);

    this.adminData.set({
      ...currentData,
      invitations: updatedInvitations,
    });
  }

  private removeInvitationFromList(invitations: AssociationInvitation[], recordId: string): AssociationInvitation[] {
    return invitations.filter((i) => i.id !== recordId);
  }

  private addOrUpdateInvitation(
    invitations: AssociationInvitation[],
    record: AssociationInvitation & Record<string, unknown>
  ): AssociationInvitation[] {
    const transformedInvitation = this.transformToAssociationInvitation(record);
    const invitationIndex = invitations.findIndex((i) => i.id === transformedInvitation.id);

    const updatedInvitations = [...invitations];
    if (invitationIndex >= 0) {
      updatedInvitations[invitationIndex] = {
        ...updatedInvitations[invitationIndex],
        ...transformedInvitation,
      };
    } else {
      updatedInvitations.push(transformedInvitation);
    }

    return updatedInvitations;
  }

  private transformToAssociationInvitation(record: Record<string, unknown>): AssociationInvitation {
    return {
      id: record['id'] as string,
      subscription_id: record['subscription_id'] as string,
      association: record['association'] as string,
      invited_email: (record['invited_email'] as string) || (record['email'] as string),
      role: (record['role'] as 'ADMIN' | 'MANAGER') || 'MANAGER',
      status: (record['status'] as 'pending' | 'ACCEPTED' | 'expired' | 'canceled') || 'pending',
      expires_at: record['expires_at'] as string,
      created_at: record['created_at'] as string,
    };
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
          // Real-time update will handle the removal
        },
        error: () => {
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
          // Real-time update will handle the role change
        },
        error: () => {
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
            // Real-time update will handle the status change
          }
        },
        error: () => {
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
          // Real-time update will handle the cancellation
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to cancel invitation',
          });
        },
      });
  }

  onInvitationSent() {
    // Real-time subscription will handle showing the new invitation
    // No need to manually reload the page
  }
}
