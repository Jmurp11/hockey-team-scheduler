import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, Button],
  template: `
    <div class="row">
      <p-button
        class="btn-1"
        icon="pi pi-external-link"
        label="Add Game"
      />
      <p-button icon="pi pi-external-link" label="Upload CSV" />
    </div>
  `,
  styleUrls: ['./schedule-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleActionsComponent {}
// This component is a placeholder for the schedule actions.
