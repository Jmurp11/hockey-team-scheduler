import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AssociationsService,
  AuthService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  Profile,
  setSelect,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { filter, map, Observable, startWith } from 'rxjs';
import { ProfileContentComponent } from './profile-content/profile-content.component';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    ProfileContentComponent,
    ProfileHeaderComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (profile$ | async; as profile) {
        <app-profile-header [name]="profile.display_name" />
        <app-profile-content
          [card]="profile"
          (formSubmit)="onFormSubmit($event)"
        />
      }
    </ion-content>
  `,
  styles: [
    `
      app-profile-header {
        display: block;
        margin-bottom: 1rem;
      }
    `,
  ],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private associationsService = inject(AssociationsService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  profile$!: Observable<Profile>;

  user$: Observable<UserProfile> = toObservable(
    this.authService.currentUser,
  ).pipe(
    startWith(null),
    filter((user) => user != null),
  );
  associations$ = this.associationsService.getAssociations();

  ngOnInit(): void {
    this.profile$ = this.user$.pipe(
      map((user) => ({
        ...user,
        team: setSelect(user.team_name, user.team_id),
        association: setSelect(user.association_name, user.association_id),
      })),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
