import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GetStartedComponent } from '../get-started.component.ts/get-started.component';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, GetStartedComponent],
  template: `
    <article class="summary-container">
      <h1 class="summary-container__content">
        The Smarter Way to Schedule Youth Hockey
      </h1>
      <p class="summary-container__content">
        RinkLink.ai is your all-in-one assistant for youth hockey scheduling. Harness AI to automatically contact opponents, negotiate game times, and fill your calendar—no more endless emails or phone calls. Instantly match with teams at your skill level, discover tournaments that fit your season, and bulk import ice slots with ease. Focus on the game, not the logistics.
      </p>
      <div class="get-started">
        <app-get-started size="small" />
      </div>
    </article>
  `,
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {}
