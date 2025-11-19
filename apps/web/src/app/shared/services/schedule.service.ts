import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { environment } from '../../environments/environment';
import { setSelect } from '../utilities/select.utility';
import { combineDateAndTime, formatTime } from '../utilities/time.utility';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private http = inject(HttpClient);
  private supabaseService = inject(SupabaseService);
  private channel: RealtimeChannel | undefined;

  gamesCache: BehaviorSubject<any[] | null> = new BehaviorSubject<any[] | null>(
    null
  );

  games(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/games?user=${userId}`);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/games/${gameId}`);
  }

  optimisticAddGames(games: any[]) {
    const currentGames = this.gamesCache.value;
    this.gamesCache.next(
      this.transformGames([...(currentGames || []), ...games])
    );
  }

  optimisticUpdateGame(updatedGame: any) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const updated = currentGames.map((game) =>
      game.id === updatedGame.id ? { ...game, ...updatedGame } : game
    );
    this.gamesCache.next(this.transformGames(updated));
  }

  optimisticDeleteGame(gameId: string) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const filtered = currentGames.filter((game) => game.id !== gameId);
    this.gamesCache.next(this.transformGames(filtered));
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
        (payload) => this.handlePayload(payload)
      )
      .subscribe();

    return this.gamesCache.asObservable();
  }

  formatUpdateData(game: any & { originalTime?: string | undefined }) {
    return {
      ...game,
      opponent: setSelect(
        game.opponent[0]?.id ? game.opponent[0].name : game.tournamentName,
        game.opponent[0]
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
        this.gamesCache.next(
          this.transformGames([...(this.gamesCache.value || []), payload.new])
        );
        break;
      case 'UPDATE':
        if (!this.gamesCache.value) return;
        const updated = this.gamesCache.value.map((game) =>
          game.id === payload.new['id'] ? payload.new : game
        );
        this.gamesCache.next(this.transformGames(updated));
        break;
      case 'DELETE':
        if (!this.gamesCache.value) return;
        const filtered = this.gamesCache.value.filter(
          (game) => game.id !== payload.old['id']
        );
        this.gamesCache.next(this.transformGames(filtered));

        break;
      default:
        break;
    }
  }

  private transformGames(games: any[] | undefined) {
    if (!games) return [];
    return games.map((game) => ({
      ...game,
      displayOpponent: game.opponent[0].name
        ? game.opponent[0].name
        : game.tournamentName,
      location: `${game.city}, ${game.state}, ${game.country}`,
      gameType:
        game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1),
      originalTime: game.time,
      time: formatTime(game.time),
    }));
  }
}
