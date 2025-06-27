import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ButtonModule],
  template: ` <app-card>
    <ng-template #title>Upload Ice Slots</ng-template>
    <ng-template #content>
      <p-button
        icon="pi pi-plus"
        [rounded]="true"
        severity="success"
        [outlined]="true"
        size="large"
    /></ng-template>
  </app-card>`,
  styles: [
    `
      :host {
        & ::ng-deep p-card {
          height: 150px;
          width: 300px;
          border-style: dashed;
          border-color: lightgray;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCardComponent {
}
