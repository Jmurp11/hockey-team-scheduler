import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, map, merge, Observable, scan, take } from 'rxjs';
import {
  setSelect,
  formatTime,
  createDateTimeLocalString,
  Game,
} from '@hockey-team-scheduler/shared-utilities';
import { APP_CONFIG } from '../config/app-config';
import { SupabaseService } from './supabase.service';

type RealtimeEvent =
  | { type: 'INSERT'; record: any }
  | { type: 'UPDATE'; record: any }
  | { type: 'DELETE'; record: any };

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private http = inject(HttpClient);
  private supabaseService = inject(SupabaseService);
  private config = inject(APP_CONFIG);

  deletedRecord = signal<string | null>(null);

  gamesCache: BehaviorSubject<any[] | null> = new BehaviorSubject<any[] | null>(
    null,
  );

  setDeleteRecord(id: string | null) {
    this.deletedRecord.set(id);
  }

  games(userId: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.config.apiUrl}/games?user=${userId}`);
  }

  gamesByTeam(teamId: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.config.apiUrl}/games?teamId=${teamId}`);
  }

  gamesByAssociation(associationId: string): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.config.apiUrl}/games?associationId=${associationId}`);
  }

  gamesFull(userId: string): Observable<Game[]> {
    const initial$ = this.games(userId).pipe(
      map((games) => ({ type: 'INIT', games: this.transformGames(games) })),
    );

    const realtime$ = this.realtimeGames$(userId);

    return merge(initial$, realtime$).pipe(
      scan((initial: Game[], payload: any) => {
        return this.handlePayload(initial, payload);
      }, []),
    );
  }

  gamesFullByTeam(teamId: string): Observable<Game[]> {
    const initial$ = this.gamesByTeam(teamId).pipe(
      map((games) => ({ type: 'INIT', games: this.transformGames(games) })),
    );

    const realtime$ = this.realtimeGamesByTeam$(teamId);

    return merge(initial$, realtime$).pipe(
      scan((initial: Game[], payload: any) => {
        return this.handlePayload(initial, payload);
      }, []),
    );
  }

  gamesFullByAssociation(associationId: string): Observable<Game[]> {
    const initial$ = this.gamesByAssociation(associationId).pipe(
      map((games) => ({ type: 'INIT', games: this.transformGames(games) })),
    );

    const realtime$ = this.realtimeGamesByAssociation$(associationId);

    return merge(initial$, realtime$).pipe(
      scan((initial: Game[], payload: any) => {
        return this.handlePayload(initial, payload);
      }, []),
    );
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete<any>(`${this.config.apiUrl}/games/${gameId}`);
  }

  realtimeGames$(userId: string): Observable<RealtimeEvent> {
    return new Observable<RealtimeEvent>((observer) => {
      const supabase = this.supabaseService.getSupabaseClient();
      if (!supabase) {
        observer.error('Supabase client not initialized');
        return;
      }
      const channel: RealtimeChannel = supabase
        ?.channel(`gamesfull:user:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gamesfull',
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as any;
            
            // For DELETE events, payload.old may only contain the id (unless REPLICA IDENTITY FULL is set)
            // So we can't filter by user - just pass through DELETE events
            if (payload.eventType === 'DELETE') {
              observer.next({
                type: payload.eventType,
                record: record,
              });
              return;
            }
            
            // Filter client-side for user's games (INSERT/UPDATE)
            if (record && String(record.user) === String(userId)) {
              observer.next({
                type: payload.eventType,
                record: record,
              });
            }
          },
        )
        .subscribe();

      // teardown logic
      return () => {
        supabase.removeChannel(channel);
      };
    });
  }

  realtimeGamesByTeam$(teamId: string): Observable<RealtimeEvent> {
    return new Observable<RealtimeEvent>((observer) => {
      const supabase = this.supabaseService.getSupabaseClient();
      if (!supabase) {
        observer.error('Supabase client not initialized');
        return;
      }
      const channel: RealtimeChannel = supabase
        ?.channel(`gamesfull:team:${teamId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gamesfull',
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as any;
            
            // For DELETE events, payload.old may only contain the id (unless REPLICA IDENTITY FULL is set)
            // So we can't filter by team - just pass through DELETE events
            if (payload.eventType === 'DELETE') {
              observer.next({
                type: payload.eventType,
                record: record,
              });
              return;
            }
            
            // Filter client-side for team's games (INSERT/UPDATE)
            if (record && String(record.team) === String(teamId)) {
              observer.next({
                type: payload.eventType,
                record: record,
              });
            }
          },
        )
        .subscribe();

      // teardown logic
      return () => {
        supabase.removeChannel(channel);
      };
    });
  }

  realtimeGamesByAssociation$(associationId: string): Observable<RealtimeEvent> {
    return new Observable<RealtimeEvent>((observer) => {
      const supabase = this.supabaseService.getSupabaseClient();
      if (!supabase) {
        observer.error('Supabase client not initialized');
        return;
      }
      const channel: RealtimeChannel = supabase
        ?.channel(`gamesfull:association:${associationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gamesfull',
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as any;
            
            // For DELETE events, payload.old may only contain the id (unless REPLICA IDENTITY FULL is set)
            // So we can't filter by association - just pass through DELETE events
            if (payload.eventType === 'DELETE') {
              observer.next({
                type: payload.eventType,
                record: record,
              });
              return;
            }
            
            // Filter client-side for association's games (INSERT/UPDATE)
            if (record && String(record.association) === String(associationId)) {
              observer.next({
                type: payload.eventType,
                record: record,
              });
            }
          },
        )
        .subscribe();

      // teardown logic
      return () => {
        supabase.removeChannel(channel);
      };
    });
  }
  formatUpdateData(game: any & { originalTime?: string | undefined }) {
    let opponent;
    if (!game.opponent) {
      opponent = setSelect('', null);
    } else {
      opponent = setSelect(
        game.opponent[0]?.id ? game.opponent[0].name : game.tournamentName,
        game.opponent[0]?.id,
      );
    }

    return {
      ...game,
      opponent: opponent,
      date: createDateTimeLocalString(game.date.toString(), game.originalTime),
      isHome: game.isHome ? 'home' : 'away',
      state: setSelect(game.state, game.state),
      country: setSelect(game.country, game.country),
    };
  }

  private handlePayload(state: Game[], payload: any) {
    switch (payload.type) {
      case 'INIT':
        return payload.games;

      case 'INSERT':
        return [...state, this.transformGame(payload.record)];

      case 'UPDATE':
        return state.map((game) =>
          game.id === payload.record.id
            ? this.transformGame(payload.record)
            : game
        );

      case 'DELETE':
        const deletedId = payload.record?.id ?? this.deletedRecord();
        this.setDeleteRecord(null);
        return state.filter((g) => String(g.id) !== String(deletedId));

      default:
        return state;
    }
  }

  handleDelete(state: Game[]): Game[] {
    const deletedId = this.deletedRecord();
    this.setDeleteRecord(null);
    return state.filter((g) => g.id !== deletedId);
  }

  private transformGame(game: any): any {
    return {
      ...game,
      displayOpponent:
        this.getOpponentName(game.opponent) || game.tournamentName,
      location: `${game.city}, ${game.state}, ${game.country}`,
      game_type:
        game.game_type?.charAt(0).toUpperCase() + game.game_type?.slice(1) ||
        'Open Slot',
      originalTime: game.time,
      time: formatTime(game.time),
    };
  }

  private transformGames(games: any[] | undefined | null) {
    if (!games) return [];
    return games.map((game) => this.transformGame(game));
  }

  private getOpponentName(opponent: any): string | null {
    if (Array.isArray(opponent) && opponent.length > 0) {
      const firstOpponent = opponent[0];

      if (Array.isArray(firstOpponent)) {
        return firstOpponent.length > 0
          ? this.getOpponentName(firstOpponent)
          : null;
      }

      if (typeof firstOpponent === 'object') {
        return firstOpponent?.name || null;
      }
    }
    if (typeof opponent === 'object') {
      return opponent?.name || null;
    }

    if (opponent === -1) {
      return null;
    }

    return opponent || null;
  }
}
