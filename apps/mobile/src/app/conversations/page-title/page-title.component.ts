import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IonBadge, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-page-title',
  standalone: true,
  imports: [CommonModule, IonIcon, IonBadge],
  template: `
    <div class="page-title">
      <div class="page-title__content">
        <h1>{{ title }}</h1>
        <div class="page-title__notification">
          <ion-icon [name]="'notifications-outline'"></ion-icon>
          @if (newMessageCount > 0) {
            <ion-badge color="danger">{{ newMessageCount }}</ion-badge>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-title {
        padding: 16px;
        background-color: var(--ion-background-color);
      }

      .page-title__content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .page-title h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--ion-color-primary);
        margin: 0;
      }

      .page-title__notification {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .page-title__notification ion-icon {
        font-size: 1.5rem;
        color: var(--ion-color-primary);
      }

      .page-title__notification ion-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        --padding-top: 2px;
        --padding-bottom: 2px;
        --padding-start: 6px;
        --padding-end: 6px;
        font-size: 0.7rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PageTitleComponent {
  @Input() title = '';
  @Input() newMessageCount = 0;

  constructor() {
    addIcons({ notificationsOutline });
  }
}
