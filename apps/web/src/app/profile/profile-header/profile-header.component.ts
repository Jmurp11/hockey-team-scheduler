import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, AvatarModule],
  template: ` <div class="page-title">
    <div class="page-title__text-container">
      <p-avatar
        icon="pi pi-user"
        class="mr-2 avatar"
        size="large"
        shape="circle"
      />

      <div class="page-title__title">{{ name }}</div>
    </div>
  </div>`,
  styleUrl: './profile-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeaderComponent {
  @Input() name: string;
}
