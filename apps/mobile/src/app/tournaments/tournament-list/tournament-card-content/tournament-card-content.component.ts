import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { IonCardContent, IonChip, Platform } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tournament-card-content',
  standalone: true,
  imports: [CommonModule, IonCardContent, IonChip],
  template: `
    <ion-card-content>
      <div class="details" [class.android]="isAndroid">
        <ion-chip class="detail-item" [attr.title]="age" [color]="'tertiary'">
          <span class="label">Age:</span>
          <span class="value">{{ age }}</span>
        </ion-chip>
        <ion-chip
          class="detail-item"
          [attr.title]="level"
          [color]="'secondary'"
        >
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
        overflow: hidden;
      }

      .label {
        font-weight: 600;
        color: var(--ion-color-dark);
        flex-shrink: 0;
      }

      .value {
        color: var(--ion-color-medium);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      ion-chip {
        min-width: 147px;
        max-width: 147px;
      }

      .details.android ion-chip {
        min-width: 125px;
        max-width: 125px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardContentComponent implements OnInit {
  @Input()
  tournament: any;

  private platform = inject(Platform);

  age = '';
  level = '';
  isAndroid = false;

  constructor() {
    this.isAndroid = this.platform.is('android');
  }

  ngOnInit(): void {
    this.age = this.tournament.ages
      ? this.tournament.ages[0].join(', ')
      : 'N/A';
    this.level = this.tournament.levels
      ? this.tournament.levels[0].join(', ')
      : 'N/A';
  }
}
