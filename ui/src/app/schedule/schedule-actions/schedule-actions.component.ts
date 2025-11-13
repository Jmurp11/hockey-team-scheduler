import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { AddGameService } from '../add-game/add-game.service';

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, Button],
  providers: [],
  template: `
    <div class="row">
      <p-button
        class="btn-1"
        icon="pi pi-plus"
        label="Add Game"
        size="small"
        (click)="openAddGameDialog()"
      />
      <p-button icon="pi pi-upload" label="Upload CSV" size="small" />
    </div>
  `,
  styleUrls: ['./schedule-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleActionsComponent {
  addGameService = inject(AddGameService);

  private viewContainerRef = inject(ViewContainerRef);

  async openAddGameDialog() {
    const { AddGameComponent } = await import('../add-game/add-game.component');
    this.viewContainerRef.clear();
    this.viewContainerRef.createComponent(AddGameComponent);
    this.addGameService.openDialog();
  }
}
