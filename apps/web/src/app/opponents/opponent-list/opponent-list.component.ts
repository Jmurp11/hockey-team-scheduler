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
  Ranking,
  SelectOption,
  setSelect,
} from '@hockey-team-scheduler/shared-utilities';
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
            [leagues]="handleLeagues(opponent)"
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
  opponents: Ranking[];

  @Output()
  opponentSelected = new EventEmitter<SelectOption<Ranking>>();

  private openAiService = inject(OpenAiService);

  destroyRef = inject(DestroyRef);

  async contactScheduler(opponent: Ranking) {
    const params = {
      team: opponent.team_name,
      location: `${opponent.city}, ${opponent.state}, ${opponent.country}`,
    };

    // TODO: get scheduler contact info
    // TODO: if no contact info, show message and offer user to add it if they have it
    // TODO: if has contact info , bring up modal, give users the option of selecting open game slots to offer or offer all open games slots.
    // TODO: Let users confirm the initial message
    // TODO: once confirmed send initial message to scheduler using start-conversation endpoint
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

  getCardContent(opponent: Ranking) {
    return getOpponentCardContent(opponent);
  }

  handleLeagues(opponent: Ranking): string[] {
    return handleLeagues(opponent);
  }

  addGame(opponent: Ranking) {
    this.opponentSelected.emit({
      ...setSelect(opponent.team_name, opponent),
    });
  }
}
