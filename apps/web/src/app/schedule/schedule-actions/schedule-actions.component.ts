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
import { take } from 'rxjs';

import {
  AddGameService,
  AuthService,
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import { AddGameDialogService } from '../add-game/add-game-dialog.service';
import {
  FileUploadParams,
  parseCsvToGames,
  readFileAsText,
} from '@hockey-team-scheduler/shared-utilities';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [CommonModule, RouterModule, Button, FileUploadComponent],
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
        <app-file-upload [fileUploadParams]="fileUploadParams" />
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
  addGameDialogService = inject(AddGameDialogService);
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);
  private viewContainerRef = inject(ViewContainerRef);
  private router = inject(Router);

  fileUploadParams: FileUploadParams = {
    mode: 'basic',
    name: 'file',
    chooseIcon: 'pi pi-upload',
    url: '/api/upload',
    accept: '.csv',
    maxFileSize: 5000000,
    auto: true,
    chooseLabel: 'Upload CSV',
    styleClass: 'p-button-sm',
    onUpload: (event: any) => {
      this.handleCsvUpload(event);
    },
  };

  ngOnInit(): void {
    this.addGameDialogService.setViewContainerRef(this.viewContainerRef);
  }

  async openAddGameDialog() {
    this.addGameDialogService.openDialog();
  }

  findNearbyTeams() {
    this.router.navigate(['/app/opponents']);
  }

  findTournaments() {
    this.router.navigate(['/app/tournaments']);
  }

  async handleCsvUpload(event: any) {
    const file = event.files?.[0];
    if (!file) {
      this.toastService.presentToast({
        severity: 'error',
        summary: 'No File',
        detail: 'Please select a CSV file to upload.',
      });
      return;
    }

    try {
      // Read file content
      const csvContent = await readFileAsText(file);

      // Get current user
      const currentUser = this.authService.currentUser();
      if (!currentUser?.user_id) {
        this.toastService.presentToast({
          severity: 'error',
          summary: 'Authentication Error',
          detail: 'User not authenticated. Please log in and try again.',
        });
        return;
      }

      // Parse CSV
      const parseResult = parseCsvToGames(csvContent, currentUser.user_id);

      if (!parseResult.success || !parseResult.data) {
        this.toastService.presentToast({
          severity: 'error',
          summary: 'Parse Error',
          detail: parseResult.errors?.join(', ') || 'Failed to parse CSV file',
        });
        return;
      }

      const games = parseResult.data;

      if (parseResult.errors && parseResult.errors.length > 0) {
        this.toastService.presentToast({
          severity: 'warn',
          summary: 'Partial Success',
          detail: `Parsed ${games.length} games with ${parseResult.errors.length} errors. Check console for details.`,
        });
        console.warn('CSV parsing errors:', parseResult.errors);
      }

      // Optimistic update
      this.scheduleService.optimisticAddGames(games);

      // Send to API
      this.addGameService
        .addGame(games)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            const gameResponses = Array.isArray(response)
              ? response
              : [response];
            this.scheduleService.syncGameIds(gameResponses);
            this.toastService.presentToast({
              severity: 'success',
              summary: 'Upload Successful',
              detail: `Successfully imported ${games.length} game${games.length !== 1 ? 's' : ''}!`,
            });
          },
          error: (error) => {
            console.error('Failed to upload games:', error);
            // Revert optimistic update
            this.scheduleService
              .games(currentUser.user_id)
              .pipe(take(1))
              .subscribe((games) => {
                this.scheduleService.gamesCache.next(games);
              });
            this.toastService.presentToast({
              severity: 'error',
              summary: 'Upload Failed',
              detail: 'Failed to import games. Please try again.',
            });
          },
        });
    } catch (error) {
      console.error('CSV upload error:', error);
      this.toastService.presentToast({
        severity: 'error',
        summary: 'Processing Error',
        detail: 'Failed to process CSV file.',
      });
    }
  }
}
