import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Manager } from '@hockey-team-scheduler/shared-utilities';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IonChip, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-contact-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, IonChip, IonIcon],
  template: `
    <div class="page-title">
      <div class="page-title__text-container">
        <app-avatar
          icon="pi pi-user"
          class="mr-2 avatar"
          size="large"
          shape="circle"
        >
          <ion-icon name="person" class="icon"></ion-icon>
        </app-avatar>

        <div class="title">{{ manager.name }}</div>

        <div>
          <ion-chip [color]="'tertiary'">
            {{ manager.team }}
          </ion-chip>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .page-title__text-container {
        @include flex(center, center, column);
        width: 100%;
        height: auto;
        padding: 0rem 4rem;
        text-align: left;
      }

      .avatar {
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

      .icon {
        font-size: 2rem;
        color: var(--primary-500);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-500);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactHeaderComponent {
  @Input()
  manager!: Manager;
}
