import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AuthService,
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, peopleOutline, trophyOutline } from 'ionicons/icons';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { FloatingActionButtonComponent } from '../shared/floating-action-button/floating-action-button.component';
import { LoadingComponent } from '../shared/loading/loading.component';
import { AddGameModalService } from './add-game/add-game-modal.service';
import { AddGameLazyWrapperComponent } from './add-game/add-game-lazy-wrapper.component';
import { ScheduleActionsComponent } from './schedule-actions/schedule-actions.component';
import { ScheduleListComponent } from './schedule-list/schedule-list.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    ScheduleActionsComponent,
    LoadingComponent,
    ScheduleListComponent,
    FloatingActionButtonComponent,
    AddGameLazyWrapperComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Schedule</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (games$ | async; as games) {
        @if (games === null) {
          <app-loading />
        } @else {
          <app-schedule-list
            [games]="games"
            (contactTeam)="handleContactTeam($event)"
            (edit)="handleEdit($event)"
            (delete)="handleDelete($event)"
          />
        }
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
    `,
  ],
})
export class SchedulePage implements OnInit {
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private addGameModalService = inject(AddGameModalService);
  private router = inject(Router);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user$: Observable<any> = toObservable(this.authService.currentUser);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  games$: Observable<any[] | undefined> | undefined;

  constructor() {
    addIcons({ addOutline, peopleOutline, trophyOutline });
  }

  ngOnInit(): void {
    this.games$ = this.user$.pipe(
      filter((user) => !!user && !!user.user_id),
      switchMap((user) => this.scheduleService.gamesFull(user.user_id)),
      map((games) => games?.sort((a, b) => (a.date < b.date ? -1 : 1))),
    );
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleContactTeam(game: any): void {
    console.log('Contact team manager for game:', game.id);
    // TODO: Implement contact team manager functionality
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleEdit(game: any): void {
    this.addGameModalService.openModal(
      this.scheduleService.formatUpdateData(game),
      true,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDelete(game: any): void {
    this.scheduleService.optimisticDeleteGame(game.id);
    this.scheduleService.deleteGame(game.id).pipe(take(1)).subscribe();
  }
}
