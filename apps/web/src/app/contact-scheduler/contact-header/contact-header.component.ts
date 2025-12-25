import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Manager } from '@hockey-team-scheduler/shared-utilities';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-contact-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, ChipModule],
  template: `
    <div class="page-title">
      <div class="page-title__text-container">
        <p-avatar
          icon="pi pi-user"
          class="mr-2 avatar"
          size="large"
          shape="circle"
        />

        <div class="page-title__title">{{ manager.name }}</div>

        <div><p-chip [label]="manager.team" /></div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .avatar {
        --p-avatar-background: var(--secondary-100);
        --p-avatar-color: var(--primary-500);
      }

      .page-title__text-container {
        @include flex(center, center, column);
        width: 100%;
        height: auto;
        padding: 0rem 4rem;
        text-align: left;
      }

      .page-title__title {
        padding-left: 1rem;
        font-size: 20px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactHeaderComponent {
  @Input()
  manager: Manager;
}
