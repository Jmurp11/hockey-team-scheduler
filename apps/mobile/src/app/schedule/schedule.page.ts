import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AssociationsService,
  AuthService,
  OpenAiService,
  ScheduleRiskService,
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, peopleOutline, trophyOutline } from 'ionicons/icons';
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { FloatingActionButtonComponent } from '../shared/floating-action-button/floating-action-button.component';
import { LoadingComponent } from '../shared/loading/loading.component';
import { AddGameModalService } from './add-game/add-game-modal.service';
import { AddGameLazyWrapperComponent } from './add-game/add-game-lazy-wrapper.component';
import { ScheduleActionsComponent } from './schedule-actions/schedule-actions.component';
import { ScheduleListComponent } from './schedule-list/schedule-list.component';
import { Game, UserProfile } from '@hockey-team-scheduler/shared-utilities';
import { ContactSchedulerDialogService } from '../contact-scheduler/contact-scheduler.service';
import { ContactSchedulerLazyWrapperComponent } from '../contact-scheduler/contact-scheduler-lazy-wrapper.component';
import { ToolbarActionsComponent } from '../shared/components/toolbar-actions/toolbar-actions.component';

interface TeamOption {
  label: string;
  value: string;
  isMyTeam?: boolean;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    ScheduleActionsComponent,
    LoadingComponent,
    ScheduleListComponent,
    FloatingActionButtonComponent,
    AddGameLazyWrapperComponent,
    ContactSchedulerLazyWrapperComponent,
    ToolbarActionsComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Schedule</ion-title>
        <ion-buttons slot="end">
          <app-toolbar-actions />
        </ion-buttons>
      </ion-toolbar>
      @if (isAdmin()) {
        <ion-toolbar class="admin-bar">
          <ion-item lines="none">
            <ion-label>View Schedule:</ion-label>
            <ion-select
              [(ngModel)]="selectedTeamId"
              (ionChange)="onTeamChange($event)"
              interface="action-sheet"
              placeholder="Select Team"
            >
              @for (option of teamOptions(); track option.value) {
                <ion-select-option [value]="option.value">
                  {{ option.label }}
                </ion-select-option>
              }
            </ion-select>
          </ion-item>
        </ion-toolbar>
      }
    </ion-header>

    <ion-content>
      @if (contactingScheduler()) {
        <div class="loading-overlay">
          <app-loading name="circular"></app-loading>
        </div>
      }
      @if (games$ | async; as games) {
        @if (loading()) {
          <app-loading />
        } @else {
          <app-schedule-list
            [games]="games"
            (contactTeam)="handleContactTeam($event)"
            (edit)="handleEdit($event)"
            (delete)="handleDelete($event)"
          />
        }
      } @else {
        <app-loading />
      }
    </ion-content>

    <app-floating-action-button
      [slot]="'fixed'"
      [horizontal]="'end'"
      [vertical]="'bottom'"
    >
      <app-schedule-actions />
    </app-floating-action-button>

    <app-add-game-lazy-wrapper />
    <app-contact-scheduler-lazy-wrapper />
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-light);
      }

      ion-fab-button {
        ion-label {
          margin-left: 8px;
          font-size: 14px;
          font-weight: 500;
        }
      }

      ion-fab-list ion-fab-button {
        --background: var(--ion-color-primary);

        &[color='secondary'] {
          --background: var(--ion-color-secondary);
        }

        &[color='tertiary'] {
          --background: var(--ion-color-tertiary);
        }
      }

      .admin-bar {
        --background: var(--ion-color-primary);
        color: var(--ion-color-light);

        ion-item {
          --background: var(--ion-color-primary);
          color: var(--ion-color-light);
        }
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
    `,
  ],
})
export class SchedulePage implements OnInit {
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private associationsService = inject(AssociationsService);
  private addGameModalService = inject(AddGameModalService);
  private router = inject(Router);
  private openAiService = inject(OpenAiService);
  private contactSchedulerService = inject(ContactSchedulerDialogService);
  scheduleRiskService = inject(ScheduleRiskService);
  private destroyRef = inject(DestroyRef);

  contactingScheduler = signal<boolean>(false);
  currentUser = this.authService.currentUser;
  isAdmin = signal<boolean>(false);
  loading = signal<boolean>(true);
  teamOptions = signal<TeamOption[]>([]);
  selectedTeamId = signal<string>('');
  private teamSelection$ = new BehaviorSubject<{
    type: 'user' | 'team' | 'association';
    id: string;
  } | null>(null);

  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );
  games$: Observable<Game[] | undefined> | undefined;

  constructor() {
    addIcons({ addOutline, peopleOutline, trophyOutline });
  }

  ngOnInit(): void {
    // Use user$ observable to handle async user loading
    this.user$
      .pipe(
        filter((user): user is UserProfile => !!user),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => {
        this.isAdmin.set(user.role === 'ADMIN');

        // Load team options for admins
        if (user.role === 'ADMIN' && user.association_id) {
          this.loadTeamOptions(user.association_id, user.team_id);
        }

        // Initialize with user's own schedule
        if (user.user_id && !this.teamSelection$.getValue()) {
          this.teamSelection$.next({ type: 'user', id: user.user_id });
        }
      });

    // Set up reactive games based on team selection
    this.games$ = this.teamSelection$.pipe(
      tap(() => this.loading.set(true)),
      switchMap((selection) => {
        if (!selection) {
          // Default: show current user's games
          const userId = this.currentUser()?.user_id;
          return userId ? this.scheduleService.gamesFull(userId) : of([]);
        }

        switch (selection.type) {
          case 'association':
            return this.scheduleService.gamesFullByAssociation(selection.id);
          case 'team':
            return this.scheduleService.gamesFullByTeam(selection.id);
          case 'user':
          default:
            return this.scheduleService.gamesFull(selection.id);
        }
      }),
      tap((games) => {
        this.loading.set(false);
        if (games) {
          this.scheduleRiskService.evaluate(games);
        }
      }),
      map((games) => games?.sort((a, b) => (a.date < b.date ? -1 : 1))),
    );
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
                isMyTeam,
              };
            }),
          ];
          this.teamOptions.set(options);
          // Default to user's team and update teamSelection$ to load correct data
          this.selectedTeamId.set(`team:${userTeamId}`);
          this.teamSelection$.next({ type: 'team', id: userTeamId.toString() });
        }
      });
  }

  onTeamChange(event: any): void {
    const value = event.detail.value as string;
    if (!value) return;

    if (value.startsWith('association:')) {
      const associationId = value.replace('association:', '');
      this.teamSelection$.next({ type: 'association', id: associationId });
    } else if (value.startsWith('team:')) {
      const teamId = value.replace('team:', '');
      this.teamSelection$.next({ type: 'team', id: teamId });
    }
  }

  openAddGameModal(): void {
    this.addGameModalService.openModal();
  }

  findNearbyTeams(): void {
    this.router.navigate(['/app/opponents'], {
      queryParams: { from: 'schedule' },
    });
  }

  findTournaments(): void {
    this.router.navigate(['/app/tournaments'], {
      queryParams: { from: 'schedule' },
    });
  }

  handleContactTeam(game: any) {
    const opponent = game.opponent[0];
    const params = {
      team: opponent.name,
      location: `${opponent.city}, ${opponent.state}, ${opponent.country}`,
    };

    this.contactingScheduler.set(true);

    return this.openAiService
      .contactScheduler(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.contactingScheduler.set(false);
          this.contactSchedulerService.openModal(response[0]);
        },
        error: () => {
          this.contactingScheduler.set(false);
        },
      });
  }

  handleEdit(game: Game): void {
    this.addGameModalService.openModal(
      this.scheduleService.formatUpdateData(game),
      true,
    );
  }

  handleDelete(game: Game): void {
    this.scheduleService.setDeleteRecord(game.id);
    this.scheduleService.deleteGame(game.id).pipe(take(1)).subscribe();
  }
}
