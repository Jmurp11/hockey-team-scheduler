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
import { setSelect } from '@hockey-team-scheduler/shared-utilities';
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
        <app-opponent-card-content [values]="getCardContent(opponent)" />
        
        <div class="button-container">
          <app-button
            [fill]="'outline'"
            [expand]="'block'"
            (onClick)="contactScheduler(opponent)"
          >
            Contact Scheduler
          </app-button>
          <app-button
            [fill]="'outline'"
            [expand]="'block'"
            (onClick)="addGame(opponent)"
          >
            Add Game
          </app-button>
        </div>
      </app-card>
    }
  `,
  styles: [`
    app-card {
      margin-bottom: 1rem;
    }

    .button-container {
      padding: 0 1rem 1rem;
      display: flex;
      gap: 0.5rem;
      flex-direction: column;
    }
  `],
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
        map((response: any) => JSON.parse(response.output_text))
      )
      .subscribe((response) => {
        window.alert(JSON.stringify(response));
      });
  }

  getCardContent(opponent: any) {
    return Object.entries(opponent)
      .filter(([key]) => this.isStatKey(key))
      .map(([key, value]) => this.assignLabels(key, value)) as {
      label: string;
      value: string;
    }[];
  }

  isStatKey(key: string): boolean {
    return (
      key === 'agd' ||
      key === 'record' ||
      key === 'rating' ||
      key === 'sched' ||
      key === 'leagues'
    );
  }

  assignLabels(key: string, value: unknown) {
    switch (key) {
      case 'agd':
        return setSelect('Average Game Date', value);
      case 'record':
        return setSelect('Record', value);
      case 'rating':
        return setSelect('Rating', value);
      case 'sched':
        return setSelect('Strength of Schedule', value);
      case 'leagues':
        return setSelect('Leagues', this.formatLeagues(value));
      default:
        return setSelect(key, value);
    }
  }

  formatLeagues(leagues: any): string {
    const raw = leagues.map((league: any) => JSON.parse(league));
    return raw.map((league: any) => league.abbreviation).join(', ');
  }

  addGame(opponent: any) {
    this.opponentSelected.emit({
      opponent: setSelect(opponent.name, opponent),
    });
  }
}
