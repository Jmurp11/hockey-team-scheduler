import {
  ComponentRef,
  Injectable,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { GameMatchingDialogComponent } from './game-matching-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class GameMatchingDialogService {
  private _isVisible = signal(false);
  private componentRef: ComponentRef<GameMatchingDialogComponent> | null = null;
  private viewContainerRef: ViewContainerRef | null = null;

  isVisible = this._isVisible.asReadonly();

  setViewContainerRef(vcr: ViewContainerRef) {
    this.viewContainerRef = vcr;
  }

  openDialog() {
    if (this.componentRef) {
      this.closeDialog();
    }

    if (this.viewContainerRef) {
      this.componentRef = this.viewContainerRef.createComponent(
        GameMatchingDialogComponent,
      );
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
}
