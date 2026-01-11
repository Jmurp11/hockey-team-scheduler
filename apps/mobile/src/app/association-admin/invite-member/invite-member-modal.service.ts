import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InviteMemberModalService {
  private _isOpen = signal(false);

  isOpen = this._isOpen.asReadonly();

  openModal() {
    this._isOpen.set(true);
  }

  closeModal() {
    this._isOpen.set(false);
  }
}
