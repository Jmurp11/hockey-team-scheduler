import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import {
  AssociationService,
  AuthService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  Profile,
  setSelect,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
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
  ],
  template: ` @if (profile$ | async; as profile) {
    <div class="profile-title">Profile</div>
    <app-profile-header [name]="profile.display_name" />
    <div class="container">
      <app-profile-content
        [card]="profile"
        (formSubmit)="onFormSubmit($event)"
      />
    </div>
  }`,
  providers: [],
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

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
}
