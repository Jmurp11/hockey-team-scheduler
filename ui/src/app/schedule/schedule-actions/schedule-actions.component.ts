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

import { AddGameService } from '../../shared/services/add-game.service';

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
          icon="pi pi-plus"
          label="Add Game"
          size="small"
          (click)="openAddGameDialog()"
        />
        <!-- <app-file-upload [fileUploadParams]="fileUploadParams" /> -->
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

  // fileUploadParams: FileUploadParams = {
  //   mode: 'basic',
  //   name: 'file',
  //   chooseIcon: 'pi pi-upload',
  //   url: '/api/upload',
  //   accept: '.csv',
  //   maxFileSize: 1000000,
  //   auto: true,
  //   chooseLabel: 'Upload Games',
  //   styleClass: 'p-button-sm',
  //   onUpload: (event: any) => {
  //     console.log('File uploaded:', event);
  //   },
  // };

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

  // onUpload(event: any) {}
}
