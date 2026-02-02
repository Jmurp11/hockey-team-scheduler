import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  UserService,
  UserAccessService,
} from '@hockey-team-scheduler/shared-data-access';
import { UserCapability } from '@hockey-team-scheduler/shared-utilities';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string;
  externalLink?: string;
  adminOnly?: boolean;
  /** Required capability for this menu item to be visible */
  requiredCapability?: UserCapability;
  action?: () => void;
}

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
      @for (item of visibleMenuItems(); track item.label) {
        <li class="navigation__item">
          @if (item.routerLink) {
            <a
              [routerLink]="item.routerLink"
              class="navigation__link"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              <i class="{{ item.icon }}"></i>{{ item.label }}
            </a>
          } @else if (item.action) {
            <a class="navigation__link" (click)="item.action()">
              <i class="{{ item.icon }}"></i>{{ item.label }}
            </a>
          }
        </li>
      }
    </ul>
  </nav> `,
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private userAccessService = inject(UserAccessService);
  private router = inject(Router);

  sidebarVisible = true;

  title = 'RinkLink.ai';
  logo = 'assets/logo.svg';

  allMenuItems: MenuItem[] = [
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
      label: 'RinkLinkGPT',
      icon: 'bi bi-robot',
      routerLink: '/app/rinklink-gpt',
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
    {
      label: 'Admin',
      icon: 'pi pi-fw pi-cog',
      routerLink: '/app/admin',
      adminOnly: true,
    },
    {
      label: 'Developer',
      icon: 'pi pi-fw pi-code',
      routerLink: '/developer/dashboard',
      requiredCapability: UserCapability.DEVELOPER_ACCESS,
    },
    {
      label: 'Bug Report',
      icon: 'bi bi-bug',
      routerLink: '/app/bug-report',
    },
    {
      label: 'Logout',
      icon: 'pi pi-fw pi-sign-out',
      action: () => this.logout(),
    },
  ];

  visibleMenuItems = computed(() => {
    const user = this.authService.currentUser();
    const isAdmin = user?.role === 'ADMIN';
    const capabilities = this.userAccessService.capabilities();

    return this.allMenuItems.filter((item) => {
      // Filter out admin-only items if not admin
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      // Filter out items requiring a capability the user doesn't have
      if (
        item.requiredCapability &&
        !capabilities.includes(item.requiredCapability)
      ) {
        return false;
      }
      return true;
    });
  });

  async logout() {
    try {
      await this.userService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
