import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { AddGameService, AuthService, ScheduleService } from '@hockey-team-scheduler/shared-data-access';
import { createTournamentGameInfo, getDatesBetween, registerForTournament, Tournament } from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { take } from 'rxjs/internal/operators/take';
import { CardComponent } from '../../shared/components/card/card.component';
import { TournamentCardContentComponent } from './tournament-card-content/tournament-card-content.component';
import { TournamentCardHeaderComponent } from './tournament-card-header/tournament-card-header.component';
import { ToastService } from '../../shared/services/toast.service';

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
  tournaments: Tournament[] = [];

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
    // TODO: update gamesCache with the response, add toast

    this.addGameService
      .addGame(games)
      .pipe(take(1))
      .subscribe((response) => {
        if (
          response &&
          (response.hasOwnProperty('opponent') ||
            (Array.isArray(response) && response[0].hasOwnProperty('opponent')))
        ) {
          this.toastService.presentToast({
            severity: 'success',
            summary: 'Tournament Games Added',
            detail: 'The tournament games have been successfully added.',
          });
        } else {
          this.toastService.presentToast({
            severity: 'error',
            summary: 'Add Failed',
            detail:
              'There was an error adding the tournament games. Please try again.',
          });
        }
      });
  }
}
