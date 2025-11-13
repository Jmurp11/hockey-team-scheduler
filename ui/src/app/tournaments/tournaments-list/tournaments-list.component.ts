import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { TournamentCardContentComponent } from './tournament-card-content/tournament-card-content.component';
import { TournamentCardHeaderComponent } from './tournament-card-header/tournament-card-header.component';

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

  registerForTournament(tournament: any) {
    window.open(tournament.registrationUrl, '_blank');
  }

  addToSchedule(tournament: any) {
    console.log('Add to schedule', {
      ...tournament
    })
  }
}
