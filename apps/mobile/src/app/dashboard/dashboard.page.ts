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
import {
  AuthService,
  DashboardService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  DashboardSummary,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonButtons,
  IonCardContent,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChart,
  calendar,
  footballOutline,
  statsChart,
  timer,
  trophy,
} from 'ionicons/icons';
import { filter, switchMap } from 'rxjs';
import { CardComponent } from '../shared/card/card.component';
import { LoadingComponent } from '../shared/loading/loading.component';
import { CurrentRecordCardComponent } from './components/current-record-card/current-record-card.component';
import { GameSlotsCardComponent } from './components/game-slots-card/game-slots-card.component';
import { GoalDifferentialCardComponent } from './components/goal-differential-card/goal-differential-card.component';
import { StrengthOfScheduleCardComponent } from './components/strength-of-schedule-card/strength-of-schedule-card.component';
import { UpcomingGamesCardComponent } from './components/upcoming-games-card/upcoming-games-card.component';
import { UpcomingTournamentsCardComponent } from './components/upcoming-tournaments-card/upcoming-tournaments-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    LoadingComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCardContent,
    CurrentRecordCardComponent,
    StrengthOfScheduleCardComponent,
    GoalDifferentialCardComponent,
    GameSlotsCardComponent,
    UpcomingGamesCardComponent,
    UpcomingTournamentsCardComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private destroyRef = inject(DestroyRef);

  private currentUser = this.authService.currentUser;
  private user$ = toObservable(this.currentUser);

  loading = signal(true);
  dashboardData = signal<DashboardSummary | null>(null);

  constructor() {
    addIcons({
      barChart,
      calendar,
      footballOutline,
      statsChart,
      timer,
      trophy,
    });
  }

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
