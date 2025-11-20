import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonRange } from '@ionic/angular/standalone';

@Component({
  selector: 'app-range',
  standalone: true,
  imports: [IonRange],
  template: `
    <ion-range
      [min]="min"
      [max]="max"
      [value]="value"
      [step]="step"
      [snaps]="snaps"
      [pin]="pin"
      [pinFormatter]="pinFormatter"
      [ticks]="ticks"
      [activeBarStart]="activeBarStart"
      [color]="color"
      [disabled]="disabled"
      [dualKnobs]="dualKnobs"
      [label]="label"
      [labelPlacement]="labelPlacement"
      (ionChange)="ionChange.emit($event)"
      (ionInput)="ionInput.emit($event)"
    >
      <ng-content></ng-content>
    </ion-range>
  `,
  styles: []
})
export class RangeComponent {
  @Input() min = 0;
  @Input() max = 100;
  @Input() value?: number | { lower: number; upper: number };
  @Input() step = 1;
  @Input() snaps = false;
  @Input() pin = false;
  @Input() pinFormatter?: (value: number) => string | number;
  @Input() ticks = true;
  @Input() activeBarStart?: number;
  @Input() color?: string;
  @Input() disabled = false;
  @Input() dualKnobs = false;
  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked';
  @Output() ionChange = new EventEmitter<CustomEvent>();
  @Output() ionInput = new EventEmitter<CustomEvent>();
}
