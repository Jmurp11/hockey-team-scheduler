import { Injectable, signal } from '@angular/core';
import { Manager } from '@hockey-team-scheduler/shared-utilities';

@Injectable({
  providedIn: 'root',
})
export class ContactSchedulerDialogService {
  private _isOpen = signal(false);
  private _managerData = signal<Manager | null>(null);

  isOpen = this._isOpen.asReadonly();
  managerData = this._managerData.asReadonly();

  openModal(managerData: Manager | null = null) {
    if (managerData) {
      this._managerData.set(managerData);
      this._isOpen.set(true);
    }
  }

  closeModal() {
    this._isOpen.set(false);
    // Reset after animation completes
    setTimeout(() => {
      this._managerData.set(null);
    }, 300);
  }
}
