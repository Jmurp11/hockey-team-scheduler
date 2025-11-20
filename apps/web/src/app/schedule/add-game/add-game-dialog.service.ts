import {
  ComponentRef,
  Injectable,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { AddGameComponent } from './add-game.component';

@Injectable({
  providedIn: 'root',
})
export class AddGameDialogService {
  private _isVisible = signal(false);

  private componentRef: ComponentRef<AddGameComponent> | null = null;
  private viewContainerRef: ViewContainerRef | null = null;

  isVisible = this._isVisible.asReadonly();

  setViewContainerRef(vcr: ViewContainerRef) {
    this.viewContainerRef = vcr;
  }

  openDialog(gameData: any | null = null, editMode: boolean = false) {
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
}
