import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { MenuHeaderComponent } from './menu-header/menu-header.component';
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
    MenuHeaderComponent,
    MenuItemComponent,
  ],
  // template: `<p-drawer
  //   class="sidebar"
  //   [(visible)]="sidebarVisible"
  //   position="left"
  //   closable="false"
  //   dismissible="false"
  //   closeOnEscape="false"
  //   [style]="{ width: '15rem' }"
  // >
  template: `<div style="width: 12rem; height: 100vh; position: fixed; left: 0; top: 0;">
    <p-menu [model]="items" [style]="{ width: '100%', height: '100%' }">
      <ng-template #start><app-menu-header [title]="title" /></ng-template>
      <ng-template #item let-item>
        <app-menu-item [item]="item" />
      </ng-template>
      <ng-template #end></ng-template>
    </p-menu>
  </div> `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  sidebarVisible = true;

  title = 'IceTime.ai';
  //logo = null;
  items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      routerLink: '/dashboard',
    },
    {
      label: 'Schedule',
      icon: 'pi pi-fw pi-calendar',
      routerLink: '/schedule',
    },
    {
      label: 'Profile',
      icon: 'pi pi-fw pi-user',
      routerLink: '/profile',
    },
  ];
  constructor() {}

  ngOnInit(): void {}
}
