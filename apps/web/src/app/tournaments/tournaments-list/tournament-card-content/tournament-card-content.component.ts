import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';

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
  tournament: any;

  age: string;
  level: string;

  ngOnInit(): void {
    this.age = this.tournament.ages
      ? this.tournament.ages[0].join(', ')
      : 'N/A';
    this.level = this.tournament.levels
      ? this.tournament.levels[0].join(', ')
      : 'N/A';
  }
}
