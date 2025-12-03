import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import {
  AddGameService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  createTournamentGameInfo,
  getDatesBetween,
  registerForTournament,
} from '@hockey-team-scheduler/shared-utilities';
import { take } from 'rxjs/internal/operators/take';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { TournamentCardContentComponent } from './tournament-card-content/tournament-card-content.component';
import { TournamentCardHeaderComponent } from './tournament-card-header/tournament-card-header.component';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    TournamentCardHeaderComponent,
    TournamentCardContentComponent,
  ],
  template: `
    @for (tournament of tournaments; track tournament.id) {
      <app-card>
        <app-tournament-card-header [tournament]="tournament" />
        <app-tournament-card-content [tournament]="tournament" />

        <div class="button-container">
          <app-button
            [fill]="'outline'"
            [expand]="'block'"
            [size]="'small'"
            [color]="'secondary'"
            (onClick)="registerForTournament(tournament)"
          >
            Register
          </app-button>
          <app-button
            [fill]="'outline'"
            [expand]="'block'"
            [size]="'small'"
            [color]="'secondary'"
            (onClick)="addToSchedule(tournament)"
          >
            Add
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
        @include flex(space-between, center, row);
        gap: 0.5rem;
        padding: 1rem;
        width: 100%;
        app-button {
          width: 100% !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentListComponent {
  @Input()
  tournaments: any[] = [];

  private addGameService = inject(AddGameService);
  private authService = inject(AuthService);

  registerForTournament(tournament: any) {
    registerForTournament(tournament);
  }

  addToSchedule(tournament: any) {
    const gameInfo = createTournamentGameInfo(
      tournament,
      this.authService.currentUser().user_id,
    );

    const dates = getDatesBetween(
      tournament.startDate,
      tournament.endDate,
    );
    const games = dates.map((date) => ({
      ...gameInfo,
      date,
    }));
    this.addGameService.addGame(games).pipe(take(1)).subscribe();
  }
}
