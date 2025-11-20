import { Component, Input } from '@angular/core';
import { IonProgressBar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [IonProgressBar],
  template: `
    <ion-progress-bar
      [type]="type"
      [value]="value"
      [buffer]="buffer"
      [color]="color"
      [reversed]="reversed"
    >
    </ion-progress-bar>
  `,
  styles: []
})
export class ProgressBarComponent {
  @Input() type: 'determinate' | 'indeterminate' = 'determinate';
  @Input() value?: number;
  @Input() buffer?: number;
  @Input() color?: string;
  @Input() reversed = false;
}
