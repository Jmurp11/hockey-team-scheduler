import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeaturesComponent } from '../features/features.component';
import { GetStartedComponent } from '../get-started.component.ts/get-started.component';
import { SummaryComponent } from '../summary/summary.component';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SummaryComponent,
    FeaturesComponent,
    GetStartedComponent,
  ],
  template: `
    <main class="main-content">
      <section class="main-content__section">
        <app-summary />
      </section>

      <section class="main-content__section key-features"><app-features /></section>

      <section class="main-content__section main-content__get-started">
        <app-get-started size="large" />
      </section>
    </main>
  `,
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'RinkLink.ai - AI-Powered Youth Hockey Scheduling & Tournament Management',
      description:
        'Streamline youth hockey team scheduling with RinkLink.ai. AI-powered opponent matching, automated game scheduling, tournament discovery, and bulk ice slot import. Save time and focus on the game.',
      url: 'https://rinklink.ai',
      keywords:
        'youth hockey, hockey scheduling, tournament management, ice hockey, team scheduling, opponent matching, hockey tournaments, ice time scheduling, sports management, AI scheduling',
    });

    // Add structured data
    this.seoService.addMultipleStructuredData([
      this.seoService.getOrganizationSchema(),
      this.seoService.getWebSiteSchema(),
      this.seoService.getSoftwareApplicationSchema(),
    ]);
  }
}
