import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  getOpponentCardContent,
  handleLeagues,
  Ranking,
  SelectOption,
  setSelect,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { OpponentCardContentComponent } from './opponent-card-content/opponent-card-content.component';
import { OpponentCardHeaderComponent } from './opponent-card-header/opponent-card-header.component';

@Component({
  selector: 'app-opponents-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    OpponentCardHeaderComponent,
    OpponentCardContentComponent,
  ],
  template: `
    @for (opponent of opponents; track opponent.team_name) {
      <app-card>
        <app-opponent-card-header [opponent]="opponent" />
        <app-opponent-card-content
          [values]="getCardContent(opponent)"
          [leagues]="handleLeagues(opponent)"
        />

        <div class="button-container">
          <app-button
            [fill]="'outline'"
            [size]="'small'"
            [expand]="'block'"
            [color]="'secondary'"
            (onClick)="contactScheduler(opponent)"
          >
            Contact Scheduler
          </app-button>
          <app-button
            [fill]="'outline'"
            [size]="'small'"
            [expand]="'block'"
            [color]="'secondary'"
            (onClick)="addGame(opponent)"
          >
            Add Game
          </app-button>
        </div>
      </app-card>

    }
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      app-card {
        margin-bottom: 1rem;
      }

      .button-container {
        padding: 1rem;
        @include flex(space-between, center, row);
        gap: 0.5rem;
        width: 100%;
        app-button {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsListComponent {
  @Input()
  opponents: Ranking[] = [];

  @Output()
  opponentSelected = new EventEmitter<SelectOption<Ranking>>();

  @Output()
  contactSchedulerClicked = new EventEmitter<Ranking>();

  contactScheduler(opponent: Ranking) {
    this.contactSchedulerClicked.emit(opponent);
  }

  getCardContent(opponent: Ranking) {
    return getOpponentCardContent(opponent);
  }

  isStatKey(key: string): boolean {
    return (
      key === 'agd' || key === 'record' || key === 'rating' || key === 'sched'
    );
  }

  handleLeagues(opponent: Ranking): string[] {
    return handleLeagues(opponent);
  }

  assignLabels(key: string, value: unknown) {
    switch (key) {
      case 'agd':
        return setSelect('Average Goal Diff', value);
      case 'record':
        return setSelect('Record', value);
      case 'rating':
        return setSelect('Rating', value);
      case 'sched':
        return setSelect('Strength of Schedule', value);
      default:
        return setSelect(key, value);
    }
  }

  addGame(opponent: Ranking) {
    this.opponentSelected.emit({
      ...setSelect(opponent.team_name, opponent),
    });
  }
}
