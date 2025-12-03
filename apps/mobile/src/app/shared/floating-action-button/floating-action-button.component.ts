import { Component, Input } from '@angular/core';
import { IonFab } from '@ionic/angular/standalone';

@Component({
  selector: 'app-floating-action-button',
  standalone: true,
  imports: [IonFab],
  template: `
    <ion-fab 
      [slot]="slot"
      [vertical]="vertical" 
      [horizontal]="horizontal" 
      [edge]="edge"
    >
      <ng-content></ng-content>
    </ion-fab>
  `,
  styles: []
})
export class FloatingActionButtonComponent {
  @Input() slot?: string;
  @Input() vertical: 'top' | 'bottom' | 'center' = 'bottom';
  @Input() horizontal: 'start' | 'end' | 'center' = 'end';
  @Input() edge?: boolean;
}
