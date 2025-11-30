import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, take } from 'rxjs';
import {
  setSelect,
  combineDateAndTime,
  formatTime,
} from '@hockey-team-scheduler/shared-utilities';
import { APP_CONFIG } from '../config/app-config';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private http = inject(HttpClient);
  private supabaseService = inject(SupabaseService);
  private config = inject(APP_CONFIG);
  private channel: RealtimeChannel | undefined;

  gamesCache: BehaviorSubject<any[] | null> = new BehaviorSubject<any[] | null>(
    null,
  );

  games(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiUrl}/games?user=${userId}`);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete<any>(`${this.config.apiUrl}/games/${gameId}`);
  }

  optimisticAddGames(games: any[]) {
    const currentGames = this.gamesCache.value;
    const transformedNewGames = games.map(game => this.transformGame(game));
    this.gamesCache.next([...(currentGames || []), ...transformedNewGames]);
  }

  optimisticUpdateGame(updatedGame: any) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const updated = currentGames.map((game) =>
      game.id === updatedGame.id ? this.transformGame({ ...game, ...updatedGame }) : game,
    );
    this.gamesCache.next(updated);
  }

  optimisticDeleteGame(gameId: string) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const filtered = currentGames.filter((game) => game.id !== gameId);
    this.gamesCache.next(filtered);
  }

  gamesFull(userId: string): Observable<any[] | null> {
    if (this.channel) {
      this.supabaseService.getSupabaseClient()?.removeChannel(this.channel);
    }

    this.games(userId)
      .pipe(take(1))
      .subscribe((games) => this.gamesCache.next(this.transformGames(games)));

    this.channel = this.supabaseService
      .getSupabaseClient()
      ?.channel('games-filter-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamesfull',
          filter: `user=eq.${userId}`,
        },
        (payload) => this.handlePayload(payload),
      )
      .subscribe();

    return this.gamesCache.asObservable();
  }

  formatUpdateData(game: any & { originalTime?: string | undefined }) {
    return {
      ...game,
      opponent: setSelect(
        game.opponent[0]?.id ? game.opponent[0].name : game.tournamentName,
        game.opponent[0]?.id, // Use just the ID, not the whole object
      ),
      date: combineDateAndTime(game.date.toString(), game.originalTime),
      isHome: game.isHome ? 'home' : 'away',
      state: setSelect(game.state, game.state),
      country: setSelect(game.country, game.country),
    };
  }

  private handlePayload(payload: any) {
    switch (payload.eventType) {
      case 'INSERT':
        const transformedNewGame = this.transformGame(payload.new);
        this.gamesCache.next([...(this.gamesCache.value || []), transformedNewGame]);
        break;
      case 'UPDATE':
        if (!this.gamesCache.value) return;
        const updated = this.gamesCache.value.map((game) =>
          game.id === payload.new['id'] ? this.transformGame(payload.new) : game,
        );
        this.gamesCache.next(updated);
        break;
      case 'DELETE':
        if (!this.gamesCache.value) return;
        const filtered = this.gamesCache.value.filter(
          (game) => game.id !== payload.old['id'],
        );
        this.gamesCache.next(filtered);
        break;
      default:
        break;
    }
  }

  private transformGame(game: any): any {
    return {
      ...game,
      displayOpponent:
        this.getOpponentName(game.opponent) || game.tournamentName,
      location: `${game.city}, ${game.state}, ${game.country}`,
      game_type:
        game.game_type?.charAt(0).toUpperCase() + game.game_type?.slice(1) ||
        'Unknown',
      originalTime: game.time,
      time: formatTime(game.time),
    };
  }

  private transformGames(games: any[] | undefined) {
    console.log({ games });
    if (!games) return [];
    return games.map(game => this.transformGame(game));
  }

  private getOpponentName(opponent: any): string | null {
    if (Array.isArray(opponent) && opponent.length > 0) {
      const firstOpponent = opponent[0];
      return typeof firstOpponent === 'object'
        ? firstOpponent.name || null
        : firstOpponent;
    }

    if (typeof opponent === 'object') {
      return opponent?.name || null;
    }

    return opponent || null;
  }
}
