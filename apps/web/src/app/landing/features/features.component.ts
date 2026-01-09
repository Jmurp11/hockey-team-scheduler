import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <article class="features-container">
      <h2>Key Features</h2>
      <div class="features-container__cards">
        @for (card of cards; track card.title) {
          <app-card class="features-container__card">
            <ng-template #title>
              <div class="title_row">
                <i [class]="card.icon" style="color: var(--primary-500)" [attr.aria-label]="card.iconLabel"></i>
                <h3>{{ card.title }}</h3>
                <span></span></div
            ></ng-template>
            <ng-template #content>
              <p>{{ card.description }}</p>
              <img
                class="features-container__card-image"
                [src]="card.image"
                [alt]="card.alt"
                loading="lazy"
                width="800"
                height="600"
              />
            </ng-template>
          </app-card>
        }
      </div>
    </article>
  `,
  styleUrls: [`./features.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesComponent {
  cards: {
    title: string;
    description: string;
    icon: string;
    iconLabel: string;
    image: string;
    alt: string;
  }[] = [];
  constructor() {
    this.cards = [
      {
        icon: 'pi pi-fw pi-microchip-ai',
        iconLabel: 'AI icon',
        title: 'AI-Powered Game Scheduling',
        description:
          'Let our intelligent assistant handle the hassle—automatically contacting opponents, negotiating game times, and adding confirmed games to your calendar.',
        image: 'ai-chat.png',
        alt: 'Screenshot of AI-powered chat interface for automated hockey game scheduling and opponent communication',
      },
      {
        icon: 'pi pi-fw pi-map-marker',
        iconLabel: 'Location icon',
        title: 'Smart Opponent Matching',
        description:
          'Instantly discover teams at your skill level, nearby or on the road. Effortlessly fill your schedule with the right matchups, wherever you play.',
        image: 'find-nearby-teams.gif',
        alt: 'Interactive map showing nearby hockey teams filtered by skill level and distance for easy opponent matching',
      },
      {
        icon: 'pi pi-fw pi-trophy',
        iconLabel: 'Trophy icon',
        title: 'One-Click Tournament Scheduling',
        description:
          `Browse and add tournaments that fit your team's calendar and skill level in seconds. No more searching—just seamless scheduling.`,
        image: 'tournaments.gif',
        alt: 'Tournament directory with filtering options and one-click registration for youth hockey tournaments',
      },
      {
        icon: 'pi pi-fw pi-upload',
        iconLabel: 'Upload icon',
        title: 'Bulk Ice Slot Import',
        description: `Easily import multiple ice time slots in bulk, saving you time and effort.  Export schedule in the format of Youth Sports Management Platforms like Crossbar and SportsEngine.`,
        image: 'bulk-upload.gif',
        alt: 'Bulk ice time slot import interface showing CSV upload and schedule export capabilities',
      },
    ];
  }
}
