import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeaturesComponent } from '../features/features.component';
import { GetStartedComponent } from '../get-started.component.ts/get-started.component';
import { SummaryComponent } from '../summary/summary.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SummaryComponent,
    FeaturesComponent,
    GetStartedComponent,
  ],
  template: `
    <div class="main-content">
      <div class="main-content__section">
        <app-summary />
      </div>

      <div class="main-content__section key-features"><app-features /></div>

      <div class="main-content__section main-content__get-started">
        <app-get-started size="large" />
      </div>
    </div>
  `,
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  
}
