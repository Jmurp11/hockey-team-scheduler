import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OpenAiService } from '@hockey-team-scheduler/shared-data-access';
import {
  getOpponentCardContent,
  handleLeagues,
  setSelect,
} from '@hockey-team-scheduler/shared-utilities';
import { map } from 'rxjs';
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
  opponents: any[] = [];

  @Output()
  opponentSelected = new EventEmitter<any>();

  private openAiService = inject(OpenAiService);
  destroyRef = inject(DestroyRef);

  async contactScheduler(opponent: any) {
    const params = {
      team: opponent.team_name,
      location: opponent.location,
    };
    return this.openAiService
      .contactScheduler(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: any) => JSON.parse(response.output_text)),
      )
      .subscribe((response) => {
        window.alert(JSON.stringify(response));
      });
  }

  getCardContent(opponent: any) {
    return getOpponentCardContent(opponent);
  }

  isStatKey(key: string): boolean {
    return (
      key === 'agd' || key === 'record' || key === 'rating' || key === 'sched'
    );
  }

  handleLeagues(opponent: any): string[] {
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

  addGame(opponent: any) {
    this.opponentSelected.emit({
      opponent: setSelect(opponent.name, opponent),
    });
  }
}
