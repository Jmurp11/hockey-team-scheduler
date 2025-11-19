import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { filter, map, Observable, startWith } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../auth/user.service';
import { AssociationService } from '../shared/services/associations.service';
import { NavigationService } from '../shared/services/navigation.service';
import { setSelect } from '../shared/utilities/select.utility';
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
        [associations$]="associations$"
        (formSubmit)="onFormSubmit($event)"
      />
    </div>
    }`,
  providers: [AssociationService, NavigationService, UserService],
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private associationsService = inject(AssociationService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private navigation = inject(NavigationService);

  profile$: Observable<any>;

  user$: Observable<any> = toObservable(this.authService.currentUser).pipe(
    startWith(null),
    filter((user) => user != null)
  );
  associations$ = this.associationsService.getAssociations();

  ngOnInit(): void {
    this.profile$ = this.user$.pipe(
      map((user) => ({
        ...user,
        team: setSelect(user.team_name, user.team_id),
        association: setSelect(user.association_name, user.association_id),
      }))
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

    this.navigation.navigateToLink('/app/schedule');
  }
}
