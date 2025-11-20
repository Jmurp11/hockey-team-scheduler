import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';

@Component({
  selector: 'app-pricing',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
  template: `
    <div class="main-content">
      <stripe-pricing-table
        pricing-table-id="prctbl_1RjVcZIIVtFpI9s54qPURfb6"
        publishable-key="pk_test_51RjUsHIIVtFpI9s5sKbxndFhWOndlpzW4iDrP2vQd51cwATj9ic8CXFNKlh3TUMII43qihw9mrWT9nmJRNOH4Oaw00dgCssny1"
      >
      </stripe-pricing-table>
    </div>
  `,
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {
  
}
