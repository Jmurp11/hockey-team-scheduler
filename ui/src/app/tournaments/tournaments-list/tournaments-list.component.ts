import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { TournamentCardContentComponent } from './tournament-card-content/tournament-card-content.component';
import { TournamentCardHeaderComponent } from './tournament-card-header/tournament-card-header.component';
import { AddGameService } from '../../schedule/add-game/add-game.service';
import { CreateGame } from '../../shared/types/game.type';
import { take } from 'rxjs/internal/operators/take';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-tournaments-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonModule,
    TournamentCardHeaderComponent,
    TournamentCardContentComponent,
  ],
  providers: [],
  template: `
    @for (tournament of tournaments; track tournament.id) {
    <app-card>
      <ng-template #header>
        <app-tournament-card-header [tournament]="tournament" />
      </ng-template>
      <ng-template #content>
        <app-tournament-card-content [tournament]="tournament" />
      </ng-template>
      <ng-template #footer>
        <span class="button-container"
          ><p-button
            icon="pi pi-trophy"
            iconPos="right"
            label="Register"
            variant="outlined"
            (click)="registerForTournament(tournament)"
        /></span>
        <span class="button-container">
          <p-button
            icon="pi pi-plus"
            iconPos="right"
            label="Add to Schedule"
            variant="outlined"
            (click)="addToSchedule(tournament)" /></span
      ></ng-template>
    </app-card>
    }
  `,
  styleUrls: [`./tournaments-list.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsListComponent {
  @Input()
  tournaments: any[] = [];

  private addGameService = inject(AddGameService);
  private authService = inject(AuthService);

  registerForTournament(tournament: any) {
    window.open(tournament.registrationUrl, '_blank');
  }

  addToSchedule(tournament: any) {
    console.log('Add to schedule', {
      ...tournament,
    });

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
