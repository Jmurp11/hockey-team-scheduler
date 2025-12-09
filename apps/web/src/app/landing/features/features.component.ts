import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="features-container">
      <h2>Key Features</h2>
      <div class="features-container__cards">
        @for (card of cards; track card.title) {
          <app-card class="features-container__card">
            <ng-template #title>{{ card.title }}</ng-template>
            <ng-template #content>
              <p>{{ card.description }}</p>
            </ng-template>
          </app-card>
        }
      </div>
    </div>
  `,
  styleUrls: [`./features.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesComponent {
  cards: { title: string; description: string }[] = [];
  constructor() {
    this.cards = [
      {
        title: 'AI-Driven Game Scheduling',
        description:
          'Our AI reaches out to other team managers, negotiates game times, and automatically adds confirmed games to your schedule—saving you time and effort.',
      },
      {
        title: 'Team Availability Suggestions',
        description:
          'Receive suggestions for the teams with matching availability, including team names, ratings, and distances',
      },
      {
        title: 'Location-Based Matching',
        description:
          'Find teams located near your home rink or schedule clusters of games for road trips',
      },
    ];
  }
}
