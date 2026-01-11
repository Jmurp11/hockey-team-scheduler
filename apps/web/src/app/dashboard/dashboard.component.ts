import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';
import { filter, switchMap } from 'rxjs';

import {
  AuthService,
  DashboardService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  DashboardSummary,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import { CardComponent } from '../shared/components/card/card.component';
import {
  CurrentRecordComponent,
  GoalDifferentialComponent,
  GameSlotsComponent,
  StrengthOfScheduleComponent,
  UpcomingGamesListComponent,
  UpcomingTournamentsListComponent,
} from './components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    ProgressSpinner,
    CurrentRecordComponent,
    GoalDifferentialComponent,
    GameSlotsComponent,
    StrengthOfScheduleComponent,
    UpcomingGamesListComponent,
    UpcomingTournamentsListComponent,
  ],
  template: `
    <div class="dashboard-container">
      @if (loading()) {
        <div class="loading-spinner">
          <p-progressSpinner></p-progressSpinner>
        </div>
      } @else if (dashboardData()) {
        <h1 class="dashboard-title">
          {{ dashboardData()!.teamName }} Dashboard
        </h1>

        <div class="stats-grid">
          <app-card class="stat-card">
            <ng-template #title>Current Record</ng-template>
            <ng-template #content>
              <app-current-record
                [record]="dashboardData()!.record"
                [wins]="dashboardData()!.wins"
                [losses]="dashboardData()!.losses"
                [ties]="dashboardData()!.ties"
                [rating]="dashboardData()!.rating"
              />
            </ng-template>
          </app-card>

          <app-card class="stat-card">
            <ng-template #title>Strength of Schedule</ng-template>
            <ng-template #content>
              <app-strength-of-schedule
                [strengthOfSchedule]="dashboardData()!.strengthOfSchedule"
              />
            </ng-template>
          </app-card>

          <app-card class="stat-card">
            <ng-template #title>Avg Goal Differential</ng-template>
            <ng-template #content>
              <app-goal-differential
                [averageGoalDifferential]="
                  dashboardData()!.averageGoalDifferential
                "
              />
            </ng-template>
          </app-card>

          <app-card class="stat-card">
            <ng-template #title>Game Slots</ng-template>
            <ng-template #content>
              <app-game-slots
                [openGameSlots]="dashboardData()!.openGameSlots"
                [totalGames]="dashboardData()!.totalGames"
              />
            </ng-template>
          </app-card>
        </div>

        <div class="lists-grid">
          <app-card class="list-card">
            <ng-template #title>Upcoming Games</ng-template>
            <ng-template #content>
              <app-upcoming-games-list
                [games]="dashboardData()!.upcomingGames"
              />
            </ng-template>
          </app-card>

          <app-card class="list-card">
            <ng-template #title>Upcoming Tournaments</ng-template>
            <ng-template #content>
              <app-upcoming-tournaments-list
                [tournaments]="dashboardData()!.upcomingTournaments"
              />
            </ng-template>
          </app-card>
        </div>
      } @else {
        <div class="error-state">
          <app-card>
            <ng-template #content>
              <p>Unable to load dashboard data. Please try again later.</p>
            </ng-template>
          </app-card>
        </div>
      }
    </div>
  `,
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private destroyRef = inject(DestroyRef);

  private currentUser = this.authService.currentUser;
  private user$ = toObservable(this.currentUser);

  loading = signal(true);
  dashboardData = signal<DashboardSummary | null>(null);

  ngOnInit(): void {
    this.user$
      .pipe(
        filter((user): user is UserProfile => !!user && !!user.team_id),
        switchMap((user) =>
          this.dashboardService.getDashboardSummary(user.team_id),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.loading.set(false);
        },
      });
  }
}
