import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [IonItem],
  template: `
    <ion-item
      [button]="button"
      [detail]="detail"
      [detailIcon]="detailIcon"
      [disabled]="disabled"
      [color]="color"
      [lines]="lines"
      (click)="itemClick.emit($event)"
    >
      <ng-content></ng-content>
    </ion-item>
  `,
  styles: []
})
export class ItemComponent {
  @Input() button = false;
  @Input() detail = false;
  @Input() detailIcon = 'chevron-forward';
  @Input() disabled = false;
  @Input() color?: string;
  @Input() lines?: 'full' | 'inset' | 'none';
  @Output() itemClick = new EventEmitter<Event>();
}
