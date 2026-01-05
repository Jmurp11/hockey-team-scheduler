import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
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
import {
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAdd } from 'ionicons/icons';
import { AssociationAdminContentComponent } from './association-admin-content/association-admin-content.component';
import { AssociationAdminHeaderComponent } from './association-admin-header/association-admin-header.component';
import { InviteMemberModalService } from './invite-member/invite-member-modal.service';
import { InviteMemberComponent } from './invite-member/invite-member.component';

@Component({
  selector: 'app-association-admin',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonIcon,
    AssociationAdminHeaderComponent,
    AssociationAdminContentComponent,
    InviteMemberComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Administration</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (adminData()) {
        <app-association-admin-header
          [associationName]="adminData()!.associationName"
          [adminName]="currentUser()?.display_name || ''"
          [subscriptionStatus]="adminData()!.subscription?.status || 'N/A'"
          [subscriptionEndDate]="adminData()!.subscription?.current_period_end || null"
          [seatsInUse]="adminData()!.subscription?.seats_in_use || 0"
          [totalSeats]="adminData()!.subscription?.total_seats || 0"
        />
        <app-association-admin-content
          [members]="adminData()!.members"
          [invitations]="adminData()!.invitations"
          (removeMember)="onRemoveMember($event)"
          (updateMemberRole)="onUpdateMemberRole($event)"
          (resendInvitation)="onResendInvitation($event)"
          (cancelInvitation)="onCancelInvitation($event)"
        />

        <!-- FAB Button for Invite -->
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button (click)="openInviteModal()">
            <ion-icon name="person-add"></ion-icon>
          </ion-fab-button>
        </ion-fab>

        <app-invite-member 
          [subscriptionId]="adminData()!.subscription?.id || ''"
          (invitationSent)="onInvitationSent()" 
        />
      } @else {
        <div class="error-container">
          <p>Unable to load association data. Please try again.</p>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .loading-container,
    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .error-container {
      color: var(--ion-color-medium);
      padding: 2rem;
      text-align: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationAdminPage implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AssociationAdminService);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private inviteMemberModalService = inject(InviteMemberModalService);
  private destroyRef = inject(DestroyRef);

  currentUser = this.authService.currentUser;
  loading = signal(true);
  adminData = signal<AssociationAdminData | null>(null);

  constructor() {
    addIcons({ personAdd });
  }

  ngOnInit(): void {
    const user = this.currentUser();
    
    // Check if user is an admin
    if (!user || user.role !== 'ADMIN') {
      this.router.navigate(['/app/profile']);
      return;
    }

    this.loadAdminData(user.association_id.toString());
  }

  private loadAdminData(associationId: string) {
    this.loading.set(true);
    this.adminService.getAssociationAdminData(associationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (data) => {
        this.adminData.set(data);
        this.loading.set(false);
      },
      error: async (err) => {
        console.error('Error loading admin data:', err);
        this.loading.set(false);
        await this.showToast('Failed to load association data', 'danger');
      },
    });
  }

  async onRemoveMember(member: AssociationMember) {
    this.adminService.removeMember(member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: async () => {
        await this.showToast('Member removed successfully', 'success');
        const user = this.currentUser();
        if (user) {
          this.loadAdminData(user.association_id.toString());
        }
      },
      error: async () => {
        await this.showToast('Failed to remove member', 'danger');
      },
    });
  }

  async onUpdateMemberRole(event: { member: AssociationMember; role: 'ADMIN' | 'MANAGER' }) {
    this.adminService.updateMemberRole(event.member.id, event.role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: async () => {
        await this.showToast(`Member role updated to ${event.role}`, 'success');
        const user = this.currentUser();
        if (user) {
          this.loadAdminData(user.association_id.toString());
        }
      },
      error: async () => {
        await this.showToast('Failed to update member role', 'danger');
      },
    });
  }

  async onResendInvitation(invitation: AssociationInvitation) {
    this.adminService.resendInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: async (result) => {
        if (result.success) {
          await this.showToast('Invitation resent successfully', 'success');
          const user = this.currentUser();
          if (user) {
            this.loadAdminData(user.association_id.toString());
          }
        }
      },
      error: async () => {
        await this.showToast('Failed to resend invitation', 'danger');
      },
    });
  }

  async onCancelInvitation(invitation: AssociationInvitation) {
    this.adminService.cancelInvitation(invitation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: async () => {
        await this.showToast('Invitation cancelled successfully', 'success');
        const user = this.currentUser();
        if (user) {
          this.loadAdminData(user.association_id.toString());
        }
      },
      error: async () => {
        await this.showToast('Failed to cancel invitation', 'danger');
      },
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  openInviteModal() {
    this.inviteMemberModalService.openModal();
  }

  onInvitationSent() {
    // Reload data to show new invitation
    const user = this.currentUser();
    if (user) {
      this.loadAdminData(user.association_id.toString());
    }
  }
}
