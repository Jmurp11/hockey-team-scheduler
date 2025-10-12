import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-tournament-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-content">
      <p class="description">{{ tournament.description }}</p>
    </div>
  `,
  styleUrls: [`./tournament-card-content.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardContentComponent {
  @Input()
  tournament: any;
}
