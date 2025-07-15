import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { MenuItem } from 'primeng/api';
import { GetStartedComponent } from './get-started.component.ts/get-started.component';
import { NavigationService } from '../shared/services/navigation.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    GetStartedComponent,
  ],
  providers: [NavigationService],
  template: `<div class="container">
    <app-header [items]="items" [title]="appTitle">
      <ng-template #start></ng-template>
      <ng-template #end>
        <div class="right-header">
          <div>
            <a
              pRipple
              class="flex items-center p-menubar-item-link"
              (click)="navigation.navigateToLink('login')"
            >
              <span>Login</span>
            </a>
          </div>
          <div>
            <app-get-started size="small" />
          </div>
        </div>
      </ng-template>
    </app-header>

    <div class="main-content">
      <router-outlet />
    </div>

    <app-footer />
  </div>`,
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  navigation = inject(NavigationService);

  appTitle = 'IceTime.ai';

  items: MenuItem[] = [
    {
      label: 'Features',
      routerLink: '/features',
    },
    {
      label: 'Pricing',
      routerLink: '/pricing',
    },
    {
      label: 'Contact',
      routerLink: '/contact',
    },
  ];
  constructor() {}
}
