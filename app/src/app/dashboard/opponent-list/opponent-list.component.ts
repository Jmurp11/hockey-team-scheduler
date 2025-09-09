import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-opponent-list',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonModule],
  template: `
    @for (opponent of opponents; track opponent.team_name) {
    <app-card>
      <ng-template #title>{{ opponent.team_name }}</ng-template>
      <ng-template #subtitle>{{ opponent.name }}</ng-template>
      <ng-template #footer>
        <p-button icon="pi pi-user" iconPos="right" label="Contact Scheduler" size="large"  variant="text"
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
}
