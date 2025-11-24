import { HttpClient } from '@angular/common/http';
import {
  ComponentRef,
  inject,
  Injectable,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { environment } from '../../environments/environment';
import { AddGameComponent } from '../../schedule/add-game/add-game.component';

@Injectable({
  providedIn: 'root',
})
export class AddGameService {
  private _isVisible = signal(false);
  private http = inject(HttpClient);

  private componentRef: ComponentRef<AddGameComponent> | null = null;
  private viewContainerRef: ViewContainerRef | null = null;

  isVisible = this._isVisible.asReadonly();

  setViewContainerRef(vcr: ViewContainerRef) {
    this.viewContainerRef = vcr;
  }

  openDialog(gameData: any | null = null, editMode: boolean = false) {
    console.log({ gameData });
    if (this.componentRef) {
      this.closeDialog();
    }

    if (this.viewContainerRef) {
      this.componentRef =
        this.viewContainerRef.createComponent(AddGameComponent);
      this.componentRef.instance.gameData = gameData;
      this.componentRef.instance.editMode = editMode;
    }

    this._isVisible.set(true);
  }

  closeDialog() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    this._isVisible.set(false);
  }

  toggleDialog(): void {
    this._isVisible.set(!this._isVisible());
  }

  games() {
    return this.http.get(`${environment.apiUrl}/games`);
  }

  addGame(games: any[]) {
    const input = games.map((game) => ({
      ...game,
      opponent: game.opponent[0].id,
    }));
    return this.http.post(`${environment.apiUrl}/games/add-games`, input);
  }

  updateGame(game: any) {
    const input = {
      ...game,
      opponent: game.opponent[0].id,
    };
    return this.http.put(`${environment.apiUrl}/games/${game.id}`, input);
  }
}
