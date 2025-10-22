import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-tournament-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-content">
      <p class="description">{{ generateDescription() }}</p>
      <div>
        <span>Age: {{ tournament.age }}</span>
        <span>Level: {{ tournament.level }}</span>
      </div>
    </div>
  `,
  styleUrls: [`./tournament-card-content.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardContentComponent {
  @Input()
  tournament: any;

  generateDescription() {
    return `${this.tournament.name} is taking place from ${this.tournament.startDate} to ${this.tournament.endDate} in ${this.tournament.location}.`;
  }
}
