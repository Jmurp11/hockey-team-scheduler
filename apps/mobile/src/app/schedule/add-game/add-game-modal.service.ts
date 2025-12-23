import { Injectable, signal } from '@angular/core';
import { Game } from '@hockey-team-scheduler/shared-utilities';

@Injectable({
  providedIn: 'root',
})
export class AddGameModalService {
  private _isOpen = signal(false);
  private _gameData = signal<Partial<Game> | null>(null);
  private _editMode = signal(false);

  isOpen = this._isOpen.asReadonly();
  gameData = this._gameData.asReadonly();
  editMode = this._editMode.asReadonly();

  openModal(gameData: Partial<Game> | null = null, editMode = false) {
    this._gameData.set(gameData);
    this._editMode.set(editMode);
    this._isOpen.set(true);
  }

  closeModal() {
    this._isOpen.set(false);
    // Reset after animation completes
    setTimeout(() => {
      this._gameData.set(null);
      this._editMode.set(false);
    }, 300);
  }
}
