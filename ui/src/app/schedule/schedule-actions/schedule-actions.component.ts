import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { AddGameService } from '../add-game/add-game.service';
import { AddGameComponent } from '../add-game/add-game.component';

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, Button, AddGameComponent],
  providers: [],
  template: `
    <div class="row">
      <p-button
        class="btn-1"
        icon="pi pi-external-link"
        label="Add Game"
        size="small"
        (click)="addGameService.openDialog()"
      />
      <p-button icon="pi pi-external-link" label="Upload CSV" size="small" />
    </div>

    <app-add-game></app-add-game>
  `,
  styleUrls: ['./schedule-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleActionsComponent {
  addGameService = inject(AddGameService);
}
