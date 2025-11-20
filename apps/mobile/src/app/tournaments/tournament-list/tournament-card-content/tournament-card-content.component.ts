import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
} from '@angular/core';
import { IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tournament-card-content',
  standalone: true,
  imports: [CommonModule, IonCardContent],
  template: `
    <ion-card-content>
      <p class="description">{{ tournament.description }}</p>
      <div class="details">
        <div class="detail-item">
          <span class="label">Age:</span>
          <span class="value">{{ age }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Level:</span>
          <span class="value">{{ level }}</span>
        </div>
      </div>
    </ion-card-content>
  `,
  styles: [`
    .description {
      margin-bottom: 1rem;
      color: var(--ion-color-medium);
    }

    .details {
      display: flex;
      flex-direction: column;
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
  `],
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
