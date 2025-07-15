import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="features-container">
      <h2>Key Features</h2>
      <div class="features-container__cards">
        <app-card class="features-container__card">
          <ng-template #title>Ice Slot Management</ng-template>
          <ng-template #content>
            <p>
              Easily upload and manage your available ice slots for the entire
              season
            </p>
          </ng-template>
        </app-card>
        <app-card class="features-container__card">
          <ng-template #title>Team Availability Suggestions</ng-template>
          <ng-template #content>
            <p>
              Receive suggestions for the teams with matching availability,
              including team names, ratings, and distances
            </p>
          </ng-template>
        </app-card>
        <app-card class="features-container__card">
          <ng-template #title>Location-Based Matching</ng-template>
          <ng-template #content>
            <p>
              Find teams located near your home rink or schedule clusters of
              games for road trips
            </p>
          </ng-template>
        </app-card>
      </div>
    </div>
  `,
  styleUrls: [`./features.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesComponent {
  constructor() {}
}
