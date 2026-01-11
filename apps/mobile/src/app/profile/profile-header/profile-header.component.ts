import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person } from 'ionicons/icons';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, IonIcon],
  template: `
    <div class="profile-header">
      <div class="profile-header__content">
        <app-avatar class="profile-header__avatar">
          <ion-icon name="person" class="profile-header__icon"></ion-icon>
        </app-avatar>
        <div class="profile-header__title">{{ name }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-header {
        padding: 1rem;
        background: var(--ion-color-light);
        border-bottom: 1px solid var(--ion-color-light-shade);

        &__content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        &__avatar {
          width: 64px;
          height: 64px;

          ::ng-deep ion-avatar {
            width: 100%;
            height: 100%;
            background: var(--secondary-200);
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        &__icon {
          font-size: 2rem;
          color: var(--primary-500);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        &__title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary-500);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeaderComponent {
  @Input() name!: string;

  constructor() {
    addIcons({ person });
  }
}
