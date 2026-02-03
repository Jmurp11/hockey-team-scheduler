import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Feature {
  icon: string;
  iconLabel: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  alt: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="features">
      <h2>AI-Powered Scheduling Tools</h2>
      <div class="features__list">
        @for (feature of features; track feature.title; let odd = $odd) {
          <div
            class="feature-detail"
            [class.feature-detail--reversed]="odd"
          >
            <div class="feature-detail__text">
              <div class="feature-detail__heading">
                <i
                  [class]="feature.icon"
                  [attr.aria-label]="feature.iconLabel"
                ></i>
                <h3>{{ feature.title }}</h3>
              </div>
              <p>{{ feature.description }}</p>
              <ul>
                @for (bullet of feature.bullets; track bullet) {
                  <li>{{ bullet }}</li>
                }
              </ul>
            </div>
            <div class="feature-detail__image">
              <img
                [src]="feature.image"
                [alt]="feature.alt"
                loading="lazy"
                width="100%"
                height="100%"
              />
            </div>
          </div>
        }
      </div>
    </article>
  `,
  styleUrls: ['./features.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      icon: 'pi pi-map-marker',
      iconLabel: 'Location icon',
      title: 'Game Matching',
      description:
        'Find opponents at your level, nearby or on the road. RinkLink surfaces the best matchups based on skill, distance, and schedule availability.',
      bullets: [
        'Filter by skill level, distance, and open dates',
        'Request games directly from search results',
      ],
      image: 'game-matching-assistant.gif',
      alt: 'AI Agent helping to find and schedule hockey games with nearby opponents',
    },
    {
      icon: 'pi pi-exclamation-triangle',
      iconLabel: 'Risk icon',
      title: 'Scheduling Risk Monitor',
      description:
        'Stay ahead of scheduling gaps and conflicts before they become problems. The risk monitor continuously analyzes your season calendar.',
      bullets: [
        'Flags open weekends with no scheduled games',
        'Detects back-to-back games and travel conflicts',
        'Suggests actions to resolve each risk',
      ],
      image: 'schedule-risk-monitor.png',
      alt: 'Dashboard showing scheduling risk alerts for a youth hockey season',
    },
    {
      icon: 'pi pi-trophy',
      iconLabel: 'Trophy icon',
      title: 'Tournament Fit Evaluator',
      description:
        'Not every tournament is the right fit. RinkLink scores each tournament based on your schedule, location, and division preferences.',
      bullets: [
        'Automatic fit score for every listed tournament',
        'Highlights date conflicts and travel distance',
        'One-click add to your season calendar',
      ],
      image: 'tournament-fit.gif',
      alt: 'Tournament listing with fit scores and one-click scheduling',
    },
    {
      icon: 'pi pi-microchip-ai',
      iconLabel: 'AI icon',
      title: 'RinkLinkGPT',
      description:
        'Your AI scheduling assistant handles the tedious parts. Tell it what you need in plain English and it takes care of the rest.',
      bullets: [
        'Drafts and sends outreach emails to opponents',
        'Helps plan team outings and logistics',
        'Adds confirmed games to your calendar automatically',
      ],
      image: 'rinklink-gpt.png',
      alt: 'AI chat interface for automated hockey game scheduling',
    },
  ];
}
