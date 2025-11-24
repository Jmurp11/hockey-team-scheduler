import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { IonCardContent } from '@ionic/angular/standalone';
import { IonChip } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tournament-card-content',
  standalone: true,
  imports: [CommonModule, IonCardContent, IonChip],
  template: `
    <ion-card-content>
      <div class="details">
        <ion-chip class="detail-item">
          <span class="label">Age:</span>
          <span class="value">{{ age }}</span>
        </ion-chip>
        <ion-chip class="detail-item">
          <span class="label">Level:</span>
          <span class="value">{{ level }}</span>
        </ion-chip>
      </div>
      <p class="description">{{ tournament.description }}</p>
    </ion-card-content>
  `,
  styles: [
    `
      .description {
        margin-bottom: 1rem;
        color: var(--ion-color-medium);
      }

      .details {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
      }

      .detail-item {
        display: flex;
        gap: 0.5rem;
      }

      .label {
        font-weight: 600;
        color: var(--ion-color-dark);
      }

      .value {
        color: var(--ion-color-medium);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardContentComponent implements OnInit {
  @Input()
  tournament: any;

  age = '';
  level = '';

  ngOnInit(): void {
    this.age = this.tournament.ages
      ? this.tournament.ages[0].join(', ')
      : 'N/A';
    this.level = this.tournament.levels
      ? this.tournament.levels[0].join(', ')
      : 'N/A';
  }
}
