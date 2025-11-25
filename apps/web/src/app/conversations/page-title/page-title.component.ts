import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

@Component({
  selector: 'app-page-title',
  imports: [CommonModule, OverlayBadgeModule],
  template: `
    <div class="page-title">
      <div class="page-title__text-container">
        <h1 class="page-title__title">{{ title }}</h1>
        <p-overlaybadge
          [value]="newMessageCount"
          badgeSize="small"
          severity="danger"
          [badgeDisabled]="newMessageCount === 0"
        >
          <i class="pi pi-bell" style="font-size: 1.3rem"></i>
        </p-overlaybadge>
      </div>
    </div>
  `,
  styleUrls: ['page-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PageTitleComponent {
  @Input() title: string;

  @Input() newMessageCount = 0;
}
