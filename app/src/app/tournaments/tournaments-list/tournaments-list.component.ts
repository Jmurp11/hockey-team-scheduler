import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tournaments-list',
  standalone: true,
  imports: [CommonModule],
  providers: [],
  template: ` <div class="container">Tournament List</div>`,
  styleUrls: ['./tournaments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsListComponent {}
