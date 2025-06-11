import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule],
  template: `<p-menu class="layout-sidebar" [model]="items" />`,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  sidebarVisible = true;

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
