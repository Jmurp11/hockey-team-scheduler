import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, take } from 'rxjs';
import {
  setSelect,
  formatTime,
  createDateTimeLocalString,
  convertTo24HourFormat,
  Game,
  handleNullOpponent,
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
    const transformedNewGames = games.map((game) => this.transformGame(game));
    this.gamesCache.next([...(currentGames || []), ...transformedNewGames]);
  }

  optimisticUpdateGame(updatedGame: any) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const updated = currentGames.map((game) =>
      game.id === updatedGame.id
        ? this.transformGame({ ...game, ...updatedGame })
        : game,
    );

    this.gamesCache.next(updated);
  }

  optimisticDeleteGame(gameId: string) {
    const currentGames = this.gamesCache.value;
    if (!currentGames) return;
    const filtered = currentGames.filter((game) => game.id !== gameId);
    this.gamesCache.next(filtered);
  }

  /**
   * Synchronize IDs from an array of games with the games cache.
   * Compares game data (excluding ID) and updates the cache with matching IDs.
   *
   * @param gamesWithIds Array of game objects containing the correct IDs
   */
  syncGameIds(gamesWithIds: Partial<Game>[], isUpdate?: boolean): void {
    const currentGames = this.gamesCache.value;
    if (!currentGames || currentGames.length === 0) return;

    const updatedGames = currentGames.map((cachedGame) =>
      this.updateGameIdIfMatched(cachedGame, gamesWithIds, isUpdate),
    );
    // Update the cache if any IDs were changed
    const hasChanges = updatedGames.some(
      (game, index) =>
        game.id !== currentGames[index].id ||
        game.displayOpponent !== currentGames[index].displayOpponent,
    );

    if (hasChanges) {
      this.gamesCache.next(updatedGames);
    }
  }

  /**
   * Update a cached game's ID if a matching game is found in the provided array
   * @param cachedGame The game from cache to potentially update
   * @param gamesWithIds Array of games with correct IDs to match against
   * @returns Updated game object with new ID if match found, otherwise original game
   */
  private updateGameIdIfMatched(
    cachedGame: any,
    gamesWithIds: Partial<Game>[],
    isUpdate?: boolean,
  ): any {
    // Find matching game in the provided array by comparing key properties
    const matchingGame = gamesWithIds.find((gameWithId) =>
      this.gamesDataMatch(cachedGame, gameWithId),
    );

    // If a match is found, update the cached game's ID
    if (matchingGame && matchingGame.id !== cachedGame.id) {
      return { ...cachedGame, id: matchingGame.id };
    }

    if (matchingGame && isUpdate) {
      return {
        ...cachedGame,
        displayOpponent: (matchingGame.opponent as { team_name: string })
          ?.team_name,
        opponent: matchingGame.opponent,
      };
    }
    return cachedGame;
  }

  /**
   * Normalize date values for comparison
   * @param date Date value to normalize
   * @returns Normalized date string in YYYY-MM-DD format
   */
  private normalizeDate(date: any): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Normalize time values for comparison
   * Handles different time formats: "10:46 PM", "23:02:00+00", etc.
   * @param time Time value to normalize
   * @returns Normalized time string in HH:MM 24-hour format
   */
  private normalizeTime(time: any): string {
    if (!time) return '';

    const timeStr = typeof time === 'string' ? time : String(time);

    try {
      // Handle 12-hour format with AM/PM (e.g., "10:46 PM")
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        return convertTo24HourFormat(timeStr.trim());
      }

      // Handle 24-hour format with possible timezone (e.g., "23:02:00+00", "14:30:15")
      if (timeStr.includes(':')) {
        // Extract just the time part, removing timezone info
        const timePart = timeStr.split('+')[0].split('-')[0].split('Z')[0];
        const timeParts = timePart.split(':');

        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);

          // Validate hours and minutes
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
      }

      // If we can't parse it, return the original string for debugging
      return timeStr;
    } catch (error) {
      // If parsing fails, return the original string
      return timeStr;
    }
  }

  /**
   * Normalize opponent values for comparison
   * @param opponent Opponent value to normalize
   * @returns Normalized opponent string
   */
  private normalizeOpponent(opponent: any): string {
    if (!opponent) return '';

    return typeof opponent === 'object' && opponent.id
      ? String(opponent.id)
      : String(opponent);
  }

  /**
   * Normalize game type for comparison
   * @param gameType Game type value to normalize
   * @returns Normalized game type string in lowercase
   */
  private normalizeGameType(gameType: any): string {
    if (!gameType) return '';
    if (gameType === 'Unknown') return '';
    return String(gameType).toLowerCase();
  }

  /**
   * Normalize home/away status for comparison
   * @param isHome Home/away value to normalize
   * @returns Normalized boolean value
   */
  private normalizeIsHome(isHome: any): boolean {
    if (typeof isHome === 'boolean') return isHome;
    if (typeof isHome === 'string') {
      return isHome.toLowerCase() === 'home' || isHome.toLowerCase() === 'true';
    }
    return Boolean(isHome);
  }

  /**
   * Normalize string field values for comparison
   * @param value String value to normalize
   * @returns Trimmed string value
   */
  private normalizeStringField(value: any): string {
    return String(value || '').trim();
  }

  /**
   * Compare two game objects to determine if they represent the same game
   * (excluding the ID field)
   *
   * @param game1 First game object
   * @param game2 Second game object
   * @returns true if games match based on key properties
   */
  private gamesDataMatch(game1: any, game2: any): boolean {
    const opponent1 = handleNullOpponent(game1);
    const opponent2 = handleNullOpponent(game2);

    return (
      this.normalizeDate(game1.date) === this.normalizeDate(game2.date) &&
      this.normalizeTime(game1.time) === this.normalizeTime(game2.time) &&
      this.normalizeOpponent(opponent1) === this.normalizeOpponent(opponent2) &&
      this.normalizeStringField(game1.rink) ===
        this.normalizeStringField(game2.rink) &&
      this.normalizeStringField(game1.city) ===
        this.normalizeStringField(game2.city) &&
      this.normalizeStringField(game1.state) ===
        this.normalizeStringField(game2.state) &&
      this.normalizeStringField(game1.country) ===
        this.normalizeStringField(game2.country) &&
      this.normalizeGameType(game1.game_type || (game1 as any).gameType) ===
        this.normalizeGameType(game2.game_type || (game2 as any).gameType) &&
      this.normalizeIsHome(game1.isHome) === this.normalizeIsHome(game2.isHome)
    );
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
    let opponent;
    if (!game.opponent) {
      opponent = setSelect('', null);
      console.log('No opponent provided, setting to empty.');
    } else {
      opponent = setSelect(
        game.opponent[0]?.id ? game.opponent[0].name : game.tournamentName,
        game.opponent[0]?.id, // Use just the ID, not the whole object
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

  private handlePayload(payload: any) {
    switch (payload.eventType) {
      case 'INSERT':
        const transformedNewGame = this.transformGame(payload.new);
        this.gamesCache.next([
          ...(this.gamesCache.value || []),
          transformedNewGame,
        ]);
        break;
      case 'UPDATE':
        if (!this.gamesCache.value) return;

        const updated = this.gamesCache.value.map((game) =>
          game.id === payload.new['id']
            ? this.transformGame(payload.new)
            : game,
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
