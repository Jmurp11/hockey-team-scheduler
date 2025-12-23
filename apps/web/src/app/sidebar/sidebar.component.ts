import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeModule, AvatarModule],
  template: `<nav class="navigation">
    <div class="navigation__logo-container">
      <span class="navigation__logo">
        RinkLink<span class="navigation__logo__ai">.ai</span>
      </span>
    </div>
    <ul class="navigation__list">
      @for (item of items; track item.label) {
        <li class="navigation__item">
          <a
            routerLink="{{ item.routerLink }}"
            class="navigation__link"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            ><i class="{{ item.icon }}"></i>{{ item.label }}</a
          >
        </li>
      }
    </ul>
  </nav> `,
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  sidebarVisible = true;

  title = 'RinkLink.ai';
  logo = 'assets/logo.svg';
  //logo = null;
  items = [
    {
      label: 'Schedule',
      icon: 'pi pi-fw pi-calendar',
      routerLink: '/app/schedule',
    },
    {
      label: 'Inbox',
      icon: 'pi pi-fw pi-inbox',
      routerLink: '/app/inbox',
    },
    {
      label: 'Opponents',
      icon: 'pi pi-fw pi-search',
      routerLink: '/app/opponents',
    },
    {
      label: 'Tournaments',
      icon: 'pi pi-fw pi-trophy',
      routerLink: '/app/tournaments',
    },
    {
      label: 'Profile',
      icon: 'pi pi-fw pi-user',
      routerLink: '/app/profile',
    },
  ];

  ngOnInit(): void {}
}
