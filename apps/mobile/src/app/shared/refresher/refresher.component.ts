import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-refresher',
  standalone: true,
  imports: [IonRefresher, IonRefresherContent],
  template: `
    <ion-refresher
      [pullFactor]="pullFactor"
      [pullMin]="pullMin"
      [pullMax]="pullMax"
      [closeDuration]="closeDuration"
      [snapbackDuration]="snapbackDuration"
      [disabled]="disabled"
      (ionRefresh)="ionRefresh.emit($event)"
    >
      <ion-refresher-content
        [pullingIcon]="pullingIcon"
        [pullingText]="pullingText"
        [refreshingSpinner]="refreshingSpinner"
        [refreshingText]="refreshingText"
      >
      </ion-refresher-content>
    </ion-refresher>
  `,
  styles: []
})
export class RefresherComponent {
  @Input() pullFactor = 1;
  @Input() pullMin = 60;
  @Input() pullMax = 180;
  @Input() closeDuration = '280ms';
  @Input() snapbackDuration = '280ms';
  @Input() disabled = false;
  @Input() pullingIcon?: string;
  @Input() pullingText?: string;
  @Input() refreshingSpinner?: string;
  @Input() refreshingText?: string;
  @Output() ionRefresh = new EventEmitter<CustomEvent>();
}
