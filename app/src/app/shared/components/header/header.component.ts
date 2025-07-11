import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  inject,
  Input,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IftaLabelModule,
    MenubarModule,
    FormsModule,
    RippleModule,
  ],
  template: ` <p-menubar [model]="items">
    <ng-template pTemplate="start">
      <a pRipple class="title flex items-center p-menubar-item-link">
        <span>{{ title }}</span>
      </a>
    </ng-template>
    <ng-template #item let-item let-root="root">
      <a pRipple class="flex items-center p-menubar-item-link">
        <span>{{ item.label }}</span>
      </a>
    </ng-template>
    <ng-template pTemplate="end">
      <ng-container *ngTemplateOutlet="end"></ng-container>
    </ng-template>
  </p-menubar>`,
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input()
  items: MenuItem[] | undefined;

  @Input()
  title: string;

  @ContentChild('start') start: TemplateRef<any> | undefined;
  @ContentChild('end') end: TemplateRef<any> | undefined;

  private router = inject(Router)
  constructor() {}
}
