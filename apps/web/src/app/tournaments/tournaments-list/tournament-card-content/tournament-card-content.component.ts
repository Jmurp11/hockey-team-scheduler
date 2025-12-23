import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Tournament } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-tournament-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-content">
      <p class="description">{{ tournament.description }}</p>
      <div class="details">
        <div><span class="label">Age:</span> {{ age }}</div>
        <div><span class="label">Level:</span> {{ level }}</div>
      </div>
    </div>
  `,
  styleUrls: [`./tournament-card-content.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardContentComponent implements OnInit {
  @Input()
  tournament!: Tournament;

  age: string;
  level: string;

  ngOnInit(): void {
    this.age = this.tournament.ages ? this.tournament.ages.join(', ') : 'N/A';
    this.level = this.tournament.levels
      ? this.tournament.levels.join(', ')
      : 'N/A';
  }
}
