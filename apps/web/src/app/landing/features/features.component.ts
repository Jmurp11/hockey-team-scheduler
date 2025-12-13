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
            <ng-template #title>
              <div class="title_row">
                <i [class]="card.icon" style="color: var(--primary-500)"></i>
                <p>{{ card.title }}</p>
                <span></span></div
            ></ng-template>
            <ng-template #content>
              <p>{{ card.description }}</p>
              <img
                class="features-container__card-image"
                [src]="card.image"
                [alt]="card.title"
              />
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
  cards: { title: string; description: string; icon: string; image: string }[] =
    [];
  constructor() {
    this.cards = [
      {
        icon: 'pi pi-fw pi-microchip-ai',
        title: 'AI-Powered Game Scheduling',
        description:
          'Let our intelligent assistant handle the hassle—automatically contacting opponents, negotiating game times, and adding confirmed games to your calendar.',
        image: 'ai-chat.png',
      },
      {
        icon: 'pi pi-fw pi-map-marker',
        title: 'Smart Opponent Matching',
        description:
          'Instantly discover teams at your skill level, nearby or on the road. Effortlessly fill your schedule with the right matchups, wherever you play.',
        image: 'find-nearby-teams.gif',
      },
      {
        icon: 'pi pi-fw pi-trophy',
        title: 'One-Click Tournament Scheduling',
        description:
          'Browse and add tournaments that fit your team’s calendar and skill level in seconds. No more searching—just seamless scheduling.',
        image: 'tournaments.gif',
      },
      {
        icon: 'pi pi-fw pi-upload',
        title: 'Bulk Ice Slot Import',
        description:
          'Easily import multiple ice time slots in bulk, saving you time and effort.  Export schedule in the format of Youth Sports Management Platforms like Crossbar and SportsEngine.',
        image: 'bulk-upload.gif',
      },
    ];
  }
}
