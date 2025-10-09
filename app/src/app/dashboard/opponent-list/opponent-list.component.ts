import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { map } from 'rxjs';
import { CardComponent } from '../../shared/components/card/card.component';
import { OpenAiService } from '../../shared/services/openai.service';
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
  providers: [OpenAiService],
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
        <p-button
          icon="pi pi-user"
          iconPos="right"
          label="Contact Scheduler"
          variant="outlined"
          (click)="contactScheduler(opponent)"
      /></ng-template>
    </app-card>
    }
  `,
  styleUrls: [`./opponent-list.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentListComponent {
  @Input()
  opponents: any[];

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
        console.log({ response });
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
        return { label: 'Avg Goal Diff', value: value };
      case 'record':
        return { label: 'Record', value: value };
      case 'rating':
        return { label: 'Rating', value: value };
      case 'sched':
        return { label: 'Strength of Schedule', value: value };
      case 'leagues':
        return {
          label: 'Leagues',
          value: this.formatLeagues(value),
        };
      default:
        return { label: key, value: value };
    }
  }

  formatLeagues(leagues: any): string {
    const raw = leagues.map((league: any) => JSON.parse(league));
    return raw.map((league: any) => league.abbreviation).join(', ');
  }
}
