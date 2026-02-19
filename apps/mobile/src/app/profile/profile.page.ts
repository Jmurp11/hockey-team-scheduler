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
  getAccountCancellationMessage,
  getAdminCancellationBlockedMessage,
  isUserAdmin,
  Profile,
  setSelect,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';
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
    IonButton,
    IonIcon,
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
        <div style="margin-top: 2rem; text-align: center;">
          <ion-button color="danger" fill="outline" (click)="onCancelAccount()">
            <ion-icon name="close-circle-outline" slot="start"></ion-icon>
            Cancel Account
          </ion-button>
        </div>
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
  private alertController = inject(AlertController);
  private navController = inject(NavController);

  profile$!: Observable<Profile>;

  user$: Observable<UserProfile> = toObservable(
    this.authService.currentUser,
  ).pipe(
    startWith(null),
    filter((user) => user != null),
  );
  associations$ = this.associationsService.getAssociations();

  constructor() {
    addIcons({ closeCircleOutline });
  }

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

  async onCancelAccount() {
    const currentUser = this.authService.currentUser();

    if (isUserAdmin(currentUser?.role)) {
      const alert = await this.alertController.create({
        header: 'Cannot Cancel Account',
        message: getAdminCancellationBlockedMessage(),
        buttons: [
          {
            text: 'Close',
            role: 'cancel',
          },
          {
            text: 'Go to Admin Page',
            handler: () => {
              this.navController.navigateForward('/app/admin');
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cancel Account',
      message: getAccountCancellationMessage(),
      buttons: [
        {
          text: 'Keep Account',
          role: 'cancel',
        },
        {
          text: 'Cancel Account',
          role: 'destructive',
          handler: async () => {
            try {
              await this.userService.cancelAccount();
              this.navController.navigateRoot('/login');
            } catch (error) {
              console.error('Error canceling account:', error);
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
