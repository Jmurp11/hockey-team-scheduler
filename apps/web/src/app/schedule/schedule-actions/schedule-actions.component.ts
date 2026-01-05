import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Button } from 'primeng/button';
import { filter, Observable, take } from 'rxjs';

import {
  AddGameService,
  AssociationsService,
  AuthService,
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import { AddGameDialogService } from '../add-game/add-game-dialog.service';
import {
  FileUploadParams,
  parseCsvToGames,
  readFileAsText,
  SelectParams,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import { FileUploadComponent } from '../../shared/components/file-upload/file-upload.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { ToastService } from '../../shared/services/toast.service';

export interface TeamOption {
  label: string;
  value: string;
}

export interface TeamSelectionEvent {
  type: 'user' | 'team' | 'association';
  id: string;
}

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Button,
    FileUploadComponent,
    SelectComponent,
    ReactiveFormsModule,
  ],
  providers: [],
  template: `
    <div class="row">
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
      @if (isAdmin()) {
        <div class="team-selector">
          <app-select
            [control]="teamSelectControl"
            [label]="'View Schedule For'"
            [options]="teamSelectOptions()"
          />
        </div>
      }
    </div>
  `,
  styleUrls: ['./schedule-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleActionsComponent implements OnInit {
  addGameDialogService = inject(AddGameDialogService);
  private authService = inject(AuthService);
  private associationsService = inject(AssociationsService);
  private scheduleService = inject(ScheduleService);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);
  private viewContainerRef = inject(ViewContainerRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Admin team selector - use toObservable to handle async user loading
  currentUser = this.authService.currentUser;
  user$: Observable<UserProfile | null> = toObservable(this.currentUser);
  isAdmin = signal<boolean>(false);
  teamOptions = signal<TeamOption[]>([]);
  teamSelectControl = new FormControl<TeamOption | null>(null);
  teamSelectOptions = signal<SelectParams<TeamOption>>({
    listItems: [],
    itemLabel: 'label',
    isAutoComplete: false,
    emptyMessage: 'No teams available',
    placeholder: 'Select Team',
    errorMessage: '',
    showClear: false,
  });

  @Output() teamSelectionChange = new EventEmitter<TeamSelectionEvent>();

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

    // Subscribe to team select control value changes
    this.teamSelectControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedOption) => {
        if (selectedOption) {
          this.onTeamChange(selectedOption.value);
        }
      });

    // Load team options for admins using user$ observable
    this.user$
      .pipe(
        filter((user): user is UserProfile => !!user),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => {
        this.isAdmin.set(user.role === 'ADMIN');
        if (user.role === 'ADMIN' && user.association_id) {
          this.loadTeamOptions(user.association_id, user.team_id);
        }
      });
  }

  private loadTeamOptions(associationId: number, userTeamId: number): void {
    this.associationsService
      .getAssociation(associationId)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((association) => {
        if (association?.teams) {
          const options: TeamOption[] = [
            {
              label: '📊 Master View (All Teams)',
              value: `association:${associationId}`,
            },
            ...association.teams.map((team: any) => {
              // Handle both 'name' and 'team_name' field names from API
              const teamName = team.team || 'Unknown Team';
              const teamId = team.id?.toString() || '';
              const isMyTeam = teamId === userTeamId.toString();
              return {
                label: isMyTeam ? `⭐ ${teamName} (My Team)` : teamName,
                value: `team:${teamId}`,
              };
            }),
          ];

          // Set options on signals
          this.teamOptions.set(options);
          this.teamSelectOptions.set({
            listItems: options,
            itemLabel: 'label',
            isAutoComplete: false,
            emptyMessage: 'No teams available',
            placeholder: 'Select Team',
            errorMessage: '',
            showClear: false,
          });

          // Find and set default to user's team
          const defaultOption = options.find(
            (opt) => opt.value === `team:${userTeamId}`,
          );
          if (defaultOption) {
            this.teamSelectControl.setValue(defaultOption, {
              emitEvent: false,
            });
          }

          // Emit initial selection so parent component loads the correct data
          this.teamSelectionChange.emit({
            type: 'team',
            id: userTeamId.toString(),
          });
        }
      });
  }

  onTeamChange(value: string): void {
    if (!value) return;

    if (value.startsWith('association:')) {
      const associationId = value.replace('association:', '');
      this.teamSelectionChange.emit({ type: 'association', id: associationId });
    } else if (value.startsWith('team:')) {
      const teamId = value.replace('team:', '');
      this.teamSelectionChange.emit({ type: 'team', id: teamId });
    }
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
      // Send to API
      this.addGameService
        .addGame(games)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            this.toastService.presentToast({
              severity: 'success',
              summary: 'Upload Successful',
              detail: `Successfully imported ${games.length} game${games.length !== 1 ? 's' : ''}!`,
            });
          },
          error: (error) => {
            console.error('Failed to upload games:', error);
            // this.scheduleService
            //   .games(currentUser.user_id)
            //   .pipe(take(1))
            //   .subscribe((games) => {
            //     this.scheduleService.gamesCache.next(games);
            //   });
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
