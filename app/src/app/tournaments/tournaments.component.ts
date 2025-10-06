import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TournamentsFilterComponent } from './tournaments-filter/tournaments-filter.component';
import { TournamentsListComponent } from './tournaments-list/tournaments-list.component';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [CommonModule, TournamentsFilterComponent, TournamentsListComponent],
  providers: [],
  template: ` <div class="container">
    <app-tournaments-filter />
    <app-tournaments-list />
  </div>`,
  styleUrls: ['./tournaments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsComponent {}
