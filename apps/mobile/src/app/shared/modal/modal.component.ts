import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IonModal],
  template: `
    <ion-modal
      [isOpen]="isOpen"
      [backdropDismiss]="backdropDismiss"
      [showBackdrop]="showBackdrop"
      [presentingElement]="presentingElement"
      (didDismiss)="didDismiss.emit($event)"
      (didPresent)="didPresent.emit($event)"
    >
      <ng-content></ng-content>
    </ion-modal>
  `,
  styles: []
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() backdropDismiss = true;
  @Input() showBackdrop = true;
  @Input() presentingElement?: HTMLElement;
  @Output() didDismiss = new EventEmitter<CustomEvent>();
  @Output() didPresent = new EventEmitter<CustomEvent>();
}
