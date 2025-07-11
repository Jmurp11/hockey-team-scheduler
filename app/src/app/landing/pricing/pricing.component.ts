import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-pricing',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <div class="container">
      <app-header [items]="items" [title]="appTitle">
        <ng-template #start></ng-template>
      </app-header>

    <div class="main-content">
    <stripe-pricing-table
        pricing-table-id="prctbl_1RjVcZIIVtFpI9s54qPURfb6"
        publishable-key="pk_test_51RjUsHIIVtFpI9s5sKbxndFhWOndlpzW4iDrP2vQd51cwATj9ic8CXFNKlh3TUMII43qihw9mrWT9nmJRNOH4Oaw00dgCssny1"
      >
      </stripe-pricing-table></div>

      <app-footer />
    </div>
  `,
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {
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
