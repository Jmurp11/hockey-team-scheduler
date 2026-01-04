import {
  ComponentRef,
  Injectable,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { InviteMemberComponent } from './invite-member.component';

@Injectable({
  providedIn: 'root',
})
export class InviteMemberDialogService {
  private _isVisible = signal(false);

  private componentRef: ComponentRef<InviteMemberComponent> | null = null;
  private viewContainerRef: ViewContainerRef | null = null;
  
  private _invitationSent = new Subject<void>();
  invitationSent$ = this._invitationSent.asObservable();

  isVisible = this._isVisible.asReadonly();

  setViewContainerRef(vcr: ViewContainerRef) {
    this.viewContainerRef = vcr;
  }

  openDialog(subscriptionId: string) {
    if (this.componentRef) {
      this.closeDialog();
    }

    if (this.viewContainerRef) {
      this.componentRef =
        this.viewContainerRef.createComponent(InviteMemberComponent);
      this.componentRef.instance.subscriptionId = subscriptionId;
      
      // Subscribe to invitationSent output
      this.componentRef.instance.invitationSent.subscribe(() => {
        this._invitationSent.next();
      });
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
