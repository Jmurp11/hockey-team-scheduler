import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    Input,
} from '@angular/core';
import { AddGameService, AuthService } from '@hockey-team-scheduler/shared-data-access';
import { CreateGame } from '@hockey-team-scheduler/shared-utilities';
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
            (onClick)="registerForTournament(tournament)"
          >
            Register
          </app-button>
          <app-button
            [fill]="'outline'"
            [expand]="'block'"
            (onClick)="addToSchedule(tournament)"
          >
            Add to Schedule
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
export class TournamentListComponent {
  @Input()
  tournaments: any[] = [];

  private addGameService = inject(AddGameService);
  private authService = inject(AuthService);

  registerForTournament(tournament: any) {
    window.open(tournament.registrationUrl, '_blank');
  }

  addToSchedule(tournament: any) {
    const location = tournament.location
      .split(',')
      .map((part: any) => part.trim());

    const gameInfo: Omit<CreateGame, 'date'> = {
      tournamentName: tournament.name,
      rink: tournament.rink,
      city: location[0] || '',
      state: location[1] || '',
      country: location[2] || '',
      time: '12:00:00',
      opponent: -1,
      game_type: 'tournament',
      isHome: false,
      user: this.authService.currentUser().user_id,
    };

    const dates = this.getDatesBetween(
      tournament.startDate,
      tournament.endDate
    );
    const games = dates.map((date) => ({
      ...gameInfo,
      date,
    }));
    this.addGameService.addGame(games).pipe(take(1)).subscribe();
  }

  private getDatesBetween(startDate: Date, endDate: Date): Date[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Array.from({ length: diffDays + 1 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }
}
