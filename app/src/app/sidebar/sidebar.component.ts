import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
// import { MenuHeaderComponent } from './menu-header/menu-header.component';
import { MenuItemComponent } from './menu-items/menu-item.component';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DrawerModule,
    MenuModule,
    BadgeModule,
    AvatarModule,
   // MenuHeaderComponent,
    MenuItemComponent,
  ],
  template: `<div class="sidebar-container">
    <p-menu [model]="items" [style]="{ height: '100%' }">
      <ng-template #item let-item class="items">
        <app-menu-item [item]="item" />
      </ng-template>
      <ng-template #end></ng-template>
    </p-menu>
  </div> `,
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  sidebarVisible = true;

  title = 'IceTime.ai';
  logo = 'assets/logo.svg';
  //logo = null;
  items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      routerLink: '/app/dashboard',
    },
    {
      label: 'Schedule',
      icon: 'pi pi-fw pi-calendar',
      routerLink: '/app/schedule',
    },
    {
      label: 'Profile',
      icon: 'pi pi-fw pi-user',
      routerLink: '/app/profile',
    },
  ];
  constructor() {}

  ngOnInit(): void {}
}
