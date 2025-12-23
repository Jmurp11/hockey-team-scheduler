import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import {
  CreateGame,
  Game,
  handleNullOpponent,
} from '@hockey-team-scheduler/shared-utilities';

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
      opponent: handleNullOpponent(game),
    }));
    return this.http.post(`${this.config.apiUrl}/games/add-games`, input);
  }

  updateGame(game: any) {
    const input = {
      ...game,
      opponent: this.handleOpponent(game.opponent),
    };
    return this.http.put(`${this.config.apiUrl}/games/${game.id}`, input);
  }

  handleOpponent(opponent: any) {
    if (opponent && opponent[0].value) {
      return opponent[0].value.id;
    }

    if (opponent && opponent[0].isArray) {
      return opponent[0][0].id;
    }

    if (opponent && !opponent[0].isArray) {
      return opponent[0].id;
    }

    return null;
  }
}
