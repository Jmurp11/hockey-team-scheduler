import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  imports: [IonInfiniteScroll, IonInfiniteScrollContent],
  template: `
    <ion-infinite-scroll
      [threshold]="threshold"
      [disabled]="disabled"
      [position]="position"
      (ionInfinite)="ionInfinite.emit($event)"
    >
      <ion-infinite-scroll-content
        [loadingSpinner]="loadingSpinner"
        [loadingText]="loadingText"
      >
      </ion-infinite-scroll-content>
    </ion-infinite-scroll>
  `,
  styles: []
})
export class InfiniteScrollComponent {
  @Input() threshold = '15%';
  @Input() disabled = false;
  @Input() position: 'top' | 'bottom' = 'bottom';
  @Input() loadingSpinner?: string;
  @Input() loadingText?: string;
  @Output() ionInfinite = new EventEmitter<CustomEvent>();
}
