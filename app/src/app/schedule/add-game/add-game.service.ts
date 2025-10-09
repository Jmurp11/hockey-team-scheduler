import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AddGameService {
  private _isVisible = signal(false);

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
}
