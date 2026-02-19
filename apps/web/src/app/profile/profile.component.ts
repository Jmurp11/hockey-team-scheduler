import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  getAccountCancellationMessage,
  getAdminCancellationBlockedMessage,
  isUserAdmin,
  Profile,
  setSelect,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { filter, map, Observable, startWith } from 'rxjs';
import { ProfileContentComponent } from './profile-content/profile-content.component';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProfileContentComponent,
    ProfileHeaderComponent,
    ConfirmDialogModule,
    ButtonModule,
  ],
  template: ` @if (profile$ | async; as profile) {
    <div class="profile-title">Profile</div>
    <div class="profile-header-row">
      <app-profile-header [name]="profile.display_name" />
      <p-button
        label="Cancel Account"
        severity="danger"
        [outlined]="true"
        (click)="onCancelAccount()"
      />
    </div>
    <div class="container">
      <app-profile-content
        [card]="profile"
        (formSubmit)="onFormSubmit($event)"
      />
    </div>
    <p-confirmDialog />
  }`,
  providers: [ConfirmationService],
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  profile$: Observable<Profile>;

  user$: Observable<UserProfile> = toObservable(
    this.authService.currentUser,
  ).pipe(
    startWith(null),
    filter((user) => user != null),
  );

  ngOnInit(): void {
    this.profile$ = this.user$.pipe(
      map((user) => ({
        ...user,
        team: setSelect(user.team_name, user.team_id),
        association: setSelect(user.association_name, user.association_id),
      })),
    );
  }

  async onFormSubmit(updatedProfile: any) {
    const submission = {
      ...updatedProfile,
      association: updatedProfile.association?.value,
      team: updatedProfile.team?.value,
      age: this.userService.getAge(updatedProfile.team?.label),
      id: this.authService.session()?.user?.id,
    };

    await this.userService.updateUserProfile(submission);

    const userId = this.authService.session()?.user?.id;
    if (userId) {
      await this.authService.setCurrentUser(userId);
    }
  }

  onCancelAccount() {
    const currentUser = this.authService.currentUser();

    if (isUserAdmin(currentUser?.role)) {
      this.confirmationService.confirm({
        message: getAdminCancellationBlockedMessage(),
        header: 'Cannot Cancel Account',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Go to Admin Page',
        rejectLabel: 'Close',
        accept: () => {
          this.router.navigate(['/app/admin']);
        },
      });
      return;
    }

    this.confirmationService.confirm({
      message: getAccountCancellationMessage(),
      header: 'Cancel Account',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancel Account',
      rejectLabel: 'Keep Account',
      accept: async () => {
        try {
          await this.userService.cancelAccount();
          this.router.navigate(['/login']);
        } catch (error) {
          console.error('Error canceling account:', error);
        }
      },
    });
  }
}
