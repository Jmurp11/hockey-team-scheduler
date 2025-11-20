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
import { ButtonModule } from 'primeng/button';
import { map } from 'rxjs';
import { CardComponent } from '../../shared/components/card/card.component';
import { OpponentCardContentComponent } from './opponent-card-content/opponent-card-content.component';
import { OpponentCardHeaderComponent } from './opponent-card-header/opponent-card-header.component';

@Component({
  selector: 'app-opponent-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonModule,
    OpponentCardHeaderComponent,
    OpponentCardContentComponent,
  ],
  providers: [],
  template: `
    @for (opponent of opponents; track opponent.team_name) {
    <app-card>
      <ng-template #header>
        <app-opponent-card-header
          [opponent]="opponent"
        ></app-opponent-card-header>
      </ng-template>
      <ng-template #content>
        <app-opponent-card-content
          [values]="getCardContent(opponent)"
        ></app-opponent-card-content>
      </ng-template>
      <ng-template #footer>
        <span class="button-container">
          <p-button
            icon="pi pi-user"
            iconPos="right"
            label="Contact Scheduler"
            variant="outlined"
            (click)="contactScheduler(opponent)"
          />
        </span>
        <span class="button-container">
          <p-button
            icon="pi pi-plus"
            iconPos="right"
            label="Add Game"
            variant="outlined"
            (click)="addGame(opponent)"
          />
        </span>
      </ng-template>
    </app-card>
    }
  `,
  styleUrls: [`./opponent-list.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentListComponent {
  @Input()
  opponents: any[];

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
