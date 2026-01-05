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
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  createTournamentGameInfo,
  Game,
  getDatesBetween,
  registerForTournament,
  Tournament,
} from '@hockey-team-scheduler/shared-utilities';
import { take } from 'rxjs/internal/operators/take';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { TournamentCardContentComponent } from './tournament-card-content/tournament-card-content.component';
import { TournamentCardHeaderComponent } from './tournament-card-header/tournament-card-header.component';
import { ToastService } from '../../shared/toast/toast.service';

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
  private scheduleService = inject(ScheduleService);
  private toastService = inject(ToastService);

  registerForTournament(tournament: Tournament) {
    registerForTournament(tournament);
  }

  addToSchedule(tournament: Tournament) {
    const currentUser = this.authService.currentUser();
    const gameInfo = createTournamentGameInfo(
      tournament,
      currentUser?.user_id || '',
      currentUser?.team_id,
      currentUser?.association_id,
    );

    const dates = getDatesBetween(
      new Date(tournament.startDate),
      new Date(tournament.endDate),
    );
    const games = dates.map((date) => ({
      ...gameInfo,
      date,
    }));

    this.addGameService
      .addGame(games)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.toastService.presentSuccessToast(
            `Successfully added ${games.length} tournament games to your schedule!`,
          );
        },
        error: (error) => {
          console.error('Failed to add tournament games:', error);
          const currentGames = this.scheduleService.gamesCache.value;
          if (currentGames) {
            const rollbackGames = currentGames.filter(
              (game) =>
                !games.some(
                  (addedGame) =>
                    game.date === addedGame.date &&
                    game.tournamentName === addedGame.tournamentName,
                ),
            );
            this.scheduleService.gamesCache.next(rollbackGames);
          }
          this.toastService.presentErrorToast(
            'Failed to add tournament games. Please try again.',
          );
        },
      });
  }
}
