import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonToast } from '@ionic/angular/standalone';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IonToast],
  template: `
    <ion-toast
      [isOpen]="isOpen"
      [message]="message"
      [duration]="duration"
      [position]="position"
      [color]="color"
      [buttons]="buttons"
      [header]="header"
      [icon]="icon"
      [cssClass]="cssClass"
      (didDismiss)="didDismiss.emit($event)"
      (didPresent)="didPresent.emit($event)"
    >
    </ion-toast>
  `,
  styles: []
})
export class ToastComponent {
  @Input() isOpen = false;
  @Input() message?: string;
  @Input() duration = 2000;
  @Input() position: 'top' | 'bottom' | 'middle' = 'bottom';
  @Input() color?: string;
  @Input() buttons?: unknown[];
  @Input() header?: string;
  @Input() icon?: string;
  @Input() cssClass?: string | string[];
  @Output() didDismiss = new EventEmitter<CustomEvent>();
  @Output() didPresent = new EventEmitter<CustomEvent>();
}
