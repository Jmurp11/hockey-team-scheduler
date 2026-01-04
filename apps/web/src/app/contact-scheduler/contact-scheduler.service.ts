import {
  ComponentRef,
  Injectable,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { ContactSchedulerComponent } from './contact-scheduler.component';
import { Manager } from '@hockey-team-scheduler/shared-utilities';

@Injectable({
  providedIn: 'root',
})
export class ContactSchedulerDialogService {
  private _isVisible = signal(false);

  private componentRef: ComponentRef<ContactSchedulerComponent> | null = null;
  private viewContainerRef: ViewContainerRef | null = null;

  isVisible = this._isVisible.asReadonly();

  setViewContainerRef(vcr: ViewContainerRef) {
    this.viewContainerRef = vcr;
  }

  openDialog(managerData: Manager) {
    if (this.componentRef) {
      this.closeDialog();
    }

    if (this.viewContainerRef) {
      this.componentRef = this.viewContainerRef.createComponent(
        ContactSchedulerComponent,
      );
      this.componentRef.instance.manager = managerData;
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
