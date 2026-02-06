import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CapabilitiesComponent } from '../capabilities/capabilities.component';
import { FeaturesComponent } from '../features/features.component';
import { GetStartedComponent } from '../get-started.component.ts/get-started.component';
import { HowItWorksComponent } from '../how-it-works/how-it-works.component';
import { MobileComponent } from '../mobile/mobile.component';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ButtonModule,
    FeaturesComponent,
    GetStartedComponent,
    CapabilitiesComponent,
    HowItWorksComponent,
    MobileComponent,
  ],
  template: `
    <main class="main-content">
      <!-- Section 1: Hero -->
      <header class="hero-section">
        <h1>Youth Hockey AI: Smart Team Management & Scheduling</h1>
        <p class="hero-section__subtitle">
          RinkLink is the youth hockey team management platform that uses AI to
          find opponents, build your schedule, and manage your season — the
          hockey team scheduler that lets you focus on the game.
        </p>
        <div class="hero-section__actions">
          <app-get-started size="large" />
          <p-button
            label="See How It Works"
            variant="outlined"
            size="large"
            [rounded]="true"
            (onClick)="scrollToHowItWorks()"
          />
        </div>
      </header>

      <!-- Section 2: Problem Framing -->
      <section class="problem-section">
        <h2>Youth Hockey Team Management Shouldn't Be a Second Job</h2>
        <ul>
          @for (pain of painPoints; track pain) {
            <li>{{ pain }}</li>
          }
        </ul>
        <p class="problem-section__transition">
          RinkLink's hockey team scheduler eliminates the busywork!
        </p>
      </section>

      <!-- Section 3: Core Features -->
      <section class="main-content__section">
        <app-features />
      </section>

      <!-- Section 4: Non-AI Capabilities -->
      <section class="main-content__section">
        <app-capabilities />
      </section>

      <!-- Section 5: Mobile -->
      <section class="main-content__section">
        <app-mobile />
      </section>

      <!-- Section 6: Built for Organizations -->
      <section class="organizations-section">
        <h2>Built for Every Youth Hockey Organization</h2>
        <div class="organizations-section__grid">
          @for (org of organizations; track org.label) {
            <div class="organizations-section__item">
              <i [class]="org.icon"></i>
              <div>
                <h3>{{ org.label }}</h3>
                <p>{{ org.description }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Section 6: How It Works -->
      <section class="main-content__section">
        <app-how-it-works />
      </section>

      <!-- Section 7: Final CTA -->
      <aside class="cta-section">
        <h2>Ready to Automate Your Youth Hockey Schedule?</h2>
        <p>
          Join teams already using RinkLink's AI-powered hockey team scheduler
          to manage their season smarter.
        </p>
        <app-get-started size="large" />
      </aside>
    </main>
  `,
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Youth Hockey AI Team Management & Scheduling Software | RinkLink',
      description:
        'AI-powered youth hockey team management and scheduling software. RinkLink\'s hockey team scheduler uses AI for game matching, schedule risk monitoring, tournament management, and automated outreach — so you can focus on the game.',
      url: 'https://rinklink.ai',
      keywords:
        'youth hockey ai, team management ai, youth hockey team management, hockey team scheduler, hockey tournament management, youth hockey, hockey scheduling, tournament management, ice hockey, team scheduling, opponent matching, game matching, schedule risk monitor, tournament fit evaluator, AI scheduling assistant, RinkLinkGPT, hockey tournaments, ice time scheduling, sports management, AI scheduling, bulk ice import',
    });

    this.seoService.addMultipleStructuredData([
      this.seoService.getOrganizationSchema(),
      this.seoService.getWebSiteSchema(),
      this.seoService.getSoftwareApplicationSchema(),
]);
  }

  painPoints = [
    'Hours spent emailing and texting to find opponents',
    'Spreadsheets and group chats to track who confirmed',
    'Tournaments that conflict with games you already booked',
    'Open ice slots that go unfilled because you ran out of time',
  ];

  organizations = [
    { icon: 'pi pi-users', label: 'Team Managers', description: 'Schedule games and manage rosters without the chaos.' },
    { icon: 'pi pi-sitemap', label: 'Club Directors', description: 'Oversee multiple teams and coordinate ice across the organization.' },
    { icon: 'pi pi-trophy', label: 'Tournament Directors', description: 'List events and reach thousands of teams looking for tournaments.' },
  ];

  scrollToHowItWorks(): void {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  }
}
