import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IonButton],
  template: `
    <ion-button
      [color]="color"
      [expand]="expand"
      [fill]="fill"
      [shape]="shape"
      [size]="size"
      [strong]="strong"
      [type]="type"
      [disabled]="disabled"
      (click)="onClick.emit($event)"
    >
      <ng-content></ng-content>
    </ion-button>
  `,
  styles: []
})
export class ButtonComponent {
  @Input() color?: string;
  @Input() expand?: 'block' | 'full';
  @Input() fill?: 'clear' | 'default' | 'outline' | 'solid';
  @Input() shape?: 'round';
  @Input() size?: 'small' | 'default' | 'large';
  @Input() strong?: boolean;
  @Input() type?: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled?: boolean;
  @Output() onClick = new EventEmitter<Event>();
}
