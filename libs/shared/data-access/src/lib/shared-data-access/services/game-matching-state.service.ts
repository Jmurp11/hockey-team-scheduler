import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GameMatchResults } from '@hockey-team-scheduler/shared-utilities';
import { AuthService } from './auth.service';
import { OpenAiService } from './openai.service';
import { TeamsService } from './teams.service';

export type GameMatchingState = 'idle' | 'loading' | 'results' | 'error';

@Injectable({ providedIn: 'root' })
export class GameMatchingStateService {
  private teamsService = inject(TeamsService);
  private openAiService = inject(OpenAiService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly state = signal<GameMatchingState>('idle');
  readonly results = signal<GameMatchResults | null>(null);
  readonly errorMessage = signal('');
  readonly searchingTeamId = signal<number | null>(null);

  search(startDate: string, endDate: string): void {
    const userId = this.authService.currentUser()?.user_id;
    if (!userId) return;

    this.state.set('loading');

    this.teamsService
      .findMatches({ userId, startDate, endDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.results.set(res);
          this.state.set('results');
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message ||
              'Failed to find matches. Please try again.',
          );
          this.state.set('error');
        },
      });
  }

  handleFindContact(event: {
    teamId: number;
    team: string;
    location: string;
  }): void {
    this.searchingTeamId.set(event.teamId);

    this.openAiService
      .contactScheduler({ team: event.team, location: event.location })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (managers: any) => {
          this.searchingTeamId.set(null);
          if (managers && Array.isArray(managers) && managers.length > 0) {
            this.updateMatchWithContact(event.teamId, managers[0]);
          }
        },
        error: () => {
          this.searchingTeamId.set(null);
        },
      });
  }

  resetToForm(): void {
    this.results.set(null);
    this.state.set('idle');
  }

  reset(): void {
    this.results.set(null);
    this.errorMessage.set('');
    this.searchingTeamId.set(null);
    this.state.set('idle');
  }

  private updateMatchWithContact(
    teamId: number,
    manager: { name: string; email: string; phone?: string; team: string },
  ): void {
    const current = this.results();
    if (!current) return;

    const user = this.authService.currentUser();
    const updatedMatches = current.matches.map((m) => {
      if (m.team.id !== teamId) return m;

      const hasEmail = !!manager.email;
      return {
        ...m,
        manager: {
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          team: manager.team,
        },
        managerStatus: 'found' as const,
        ...(hasEmail
          ? {
              emailDraft: {
                to: manager.email,
                toName: manager.name,
                toTeam: m.team.name,
                subject: `Game Request: ${current.userTeam.name} vs ${m.team.name}`,
                body: `Hi ${manager.name},\n\nI'm reaching out from ${current.userTeam.name} to see if your team would be interested in scheduling a game between ${current.dateRange.start} and ${current.dateRange.end}.\n\nOur team details:\n- Rating: ${current.userTeam.rating}\n- Age Group: ${current.userTeam.age}\n\nPlease let me know if you're interested and what dates work best for your team.\n\nThanks!`,
                signature: user?.display_name || 'Team Manager',
                intent: 'schedule' as const,
                fromName: user?.display_name,
                fromEmail: user?.email,
              },
            }
          : { emailDraft: undefined }),
      };
    });

    this.results.set({ ...current, matches: updatedMatches });
  }
}
