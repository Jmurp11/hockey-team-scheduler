import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { AddGameService } from '../add-game/add-game.service';

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, Button],
  providers: [],
  template: `
    <div class="row">
      <div></div>
      <div class="sub-row">
        <p-button
          class="btn-1"
          icon="pi pi-plus"
          label="Add Game"
          size="small"
          (click)="openAddGameDialog()"
        />
        <p-button icon="pi pi-upload" label="Upload CSV" size="small" />
        <p-button
          icon="pi pi-users"
          label="Nearby Teams"
          size="small"
          (click)="findNearbyTeams()"
        />
        <p-button
          icon="pi pi-trophy"
          label="Add Tournaments"
          size="small"
          (click)="findTournaments()"
        />
      </div>
    </div>
  `,
  styleUrls: ['./schedule-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleActionsComponent implements OnInit {
  addGameService = inject(AddGameService);

  private viewContainerRef = inject(ViewContainerRef);
  private router = inject(Router);

  ngOnInit(): void {
    this.addGameService.setViewContainerRef(this.viewContainerRef);
  }
  
  async openAddGameDialog() {
    this.addGameService.openDialog();
  }

  findNearbyTeams() {
    this.router.navigate(['/app/opponents']);
  }

  findTournaments() {
    this.router.navigate(['/app/tournaments']);
  }
}
