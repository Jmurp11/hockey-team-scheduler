import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { OpponentCardHeaderComponent } from './opponent-card-header/opponent-card-header.component';
import { OpponentCardContentComponent } from './opponent-card-content/opponent-card-content.component';

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
          size="large"
          variant="text"
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

  getCardContent(opponent: any) {
    return Object.entries(opponent)
      .filter(([key, value]) => {
        return (
          key === 'agd' ||
          key === 'record' ||
          key === 'rating' ||
          key === 'sched'
        );
      })
      .map(([key, value]) => {
        switch (key) {
          case 'agd':
            return { label: 'Avg Goal Diff', value: value };
          case 'record':
            return { label: 'Record', value: value };
          case 'rating':
            return { label: 'Rating', value: value };
          case 'sched':
            return { label: 'Strength of Schedule', value: value };
          default:
            return { label: key, value: value };
        }
      }) as { label: string; value: string }[];
  }
}
