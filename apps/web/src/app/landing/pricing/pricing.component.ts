import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
} from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
  template: `
    <main class="main-content">
      <h1 class="sr-only">RinkLink.ai Pricing Plans</h1>
      <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
      <stripe-pricing-table
        pricing-table-id="prctbl_1RjVcZIIVtFpI9s54qPURfb6"
        publishable-key="pk_test_51RjUsHIIVtFpI9s5sKbxndFhWOndlpzW4iDrP2vQd51cwATj9ic8CXFNKlh3TUMII43qihw9mrWT9nmJRNOH4Oaw00dgCssny1"
      >
      </stripe-pricing-table>
    </main>
  `,
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Pricing - RinkLink.ai Hockey Scheduling Plans',
      description:
        'Choose the perfect plan for your youth hockey team. Flexible pricing for AI-powered scheduling, tournament discovery, and team management. Free trial available.',
      url: 'https://rinklink.ai/pricing',
      keywords:
        'hockey scheduling pricing, youth hockey plans, sports management pricing, hockey team subscription, tournament management cost',
    });

    // Add pricing structured data
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'RinkLink.ai Hockey Scheduling',
      description:
        'AI-powered youth hockey scheduling and tournament management platform',
      brand: {
        '@type': 'Brand',
        name: 'RinkLink.ai',
      },
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '99',
        priceCurrency: 'USD',
      },
    });
  }
}
