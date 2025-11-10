import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CreateGame } from '../../shared/types/game.type';

@Injectable({
  providedIn: 'root',
})
export class AddGameService {
  private _isVisible = signal(false);
  private http = inject(HttpClient);

  isVisible = this._isVisible.asReadonly();

  openDialog(): void {
    this._isVisible.set(true);
  }

  closeDialog(): void {
    this._isVisible.set(false);
  }

  toggleDialog(): void {
    this._isVisible.set(!this._isVisible());
  }

  games() {
    return this.http.get(`${environment.apiUrl}/games`);
  }

  addGame(game: CreateGame) {
    return this.http.post(`${environment.apiUrl}/games/add-games`, game);
  }
}
