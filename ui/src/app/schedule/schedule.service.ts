import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { Game } from '../shared/types/game.type';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private http = inject(HttpClient);
  gamesCache: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  games(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/games?user=${userId}`);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/games/${gameId}`).pipe(
      switchMap((response: any) => {
        this.deleteGameCache(gameId);
        return of(response);
      })
    );
  }

  setGamesCache(games: any[]) {
    this.gamesCache.next(games);
  }

  addGameCache(game: any) {
    console.log({
      currentCache: this.gamesCache.getValue(),
      addedgame: game[0],
    });
    const currentCache = this.gamesCache.getValue();
    this.gamesCache.next([...currentCache, game[0]]);

    console.log('CACHE: ', this.gamesCache.getValue());
  }

  updateGameCache(updatedGame: any) {
    const currentCache = this.gamesCache.getValue();
    const updatedCache = currentCache.map((game) =>
      game.id === updatedGame.id ? updatedGame : game
    );
    this.gamesCache.next(updatedCache);
  }

  deleteGameCache(deletedGameId: string) {
    const currentCache = this.gamesCache.getValue();
    const updatedCache = currentCache.filter(
      (game) => game.id !== deletedGameId
    );
    this.gamesCache.next(updatedCache);
  }

  clearGameCache() {
    this.gamesCache.next([]);
  }
}
