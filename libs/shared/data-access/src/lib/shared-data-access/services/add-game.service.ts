import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

@Injectable({
  providedIn: 'root',
})
export class AddGameService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  games() {
    return this.http.get(`${this.config.apiUrl}/games`);
  }

  addGame(games: any[]) {
    const input = games.map((game) => ({
      ...game,
      opponent: game.opponent[0] ? game.opponent[0].id : game.opponent,
    }));
    return this.http.post(`${this.config.apiUrl}/games/add-games`, input);
  }

  updateGame(game: any) {
    const input = {
      ...game,
      opponent: game.opponent[0].id,
    };
    return this.http.put(`${this.config.apiUrl}/games/${game.id}`, input);
  }
}
