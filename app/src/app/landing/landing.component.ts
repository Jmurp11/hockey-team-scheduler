import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SummaryComponent } from './summary/summary.component';
import { FeaturesComponent } from './features/features.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { GetStartedComponent } from './get-started.component.ts/get-started.component';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SummaryComponent,
    FeaturesComponent,
    FooterComponent,
    GetStartedComponent,
  ],
  template: `<div class="container">
    <app-header [items]="items" [title]="appTitle">
      <ng-template #start></ng-template>
      <ng-template #end>
        <div>
          <app-get-started size="small" />
        </div>
      </ng-template>
    </app-header>

    <div class="main-content">
      <div class="main-content__section landing-content">
        <app-summary />
      </div>

      <div class="main-content__section key-features"><app-features /></div>

      <div class="main-content__section main-content__get-started">
        <app-get-started size="large" />
      </div>
    </div>

    <app-footer />
  </div>`,
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
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
