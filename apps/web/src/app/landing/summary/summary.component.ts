import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GetStartedComponent } from '../get-started.component.ts/get-started.component';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, GetStartedComponent],
  template: `
    <div class="summary-container">
      <h2 class="summary-container__content">
        Simplify Your Youth Hockey Scheduling
      </h2>
      <div class="summary-container__content">
        RinkLink.ai streamlines the process of scheduling youth hockey games.
        Upload your available ice slots and receive suggestions for teams at
        your skill level with matching availability. Manage your schedule
        effortlessly throughout the season.
      </div>
      <div>
        <app-get-started size="small" />
      </div>
    </div>
  `,
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  
}
