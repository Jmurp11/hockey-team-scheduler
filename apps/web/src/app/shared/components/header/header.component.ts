import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { NavigationService } from '../../services/navigation.service';

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
  providers: [NavigationService],
  template: ` <p-menubar [model]="items">
    <ng-template pTemplate="start">
      @if (showHamburger) {
        <button 
          class="hamburger-menu"
          (click)="onHamburgerClick()"
          aria-label="Toggle menu">
          <i class="pi pi-bars"></i>
        </button>
      }
      <ng-container *ngTemplateOutlet="start"></ng-container>
    </ng-template>
    <ng-template #item let-item let-root="root">
      <a
        pRipple
        class="flex items-center p-menubar-item-link"
        (click)="navigation.navigateToLink(item.routerLink)"
      >
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
  class: string | undefined;

  @Input() 
  showHamburger: boolean = false;

  @Output() 
  hamburgerClick = new EventEmitter<void>();

  @ContentChild('start') start: TemplateRef<any> | undefined;
  @ContentChild('end') end: TemplateRef<any> | undefined;

  navigation = inject(NavigationService);

  onHamburgerClick() {
    this.hamburgerClick.emit();
  }
}