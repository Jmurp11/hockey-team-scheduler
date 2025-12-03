import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
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
      [ticks]="ticks"
      [activeBarStart]="activeBarStart"
      [color]="color"
      [disabled]="disabled"
      [dualKnobs]="dualKnobs"
      [label]="label"
      [labelPlacement]="labelPlacement"
      [debounce]="debounce"
      [mode]="mode"
      [name]="name"
      (ionChange)="ionChange.emit($event)"
      (ionInput)="ionInput.emit($event)"
      (ionBlur)="ionBlur.emit($event)"
      (ionFocus)="ionFocus.emit($event)"
      (ionKnobMoveStart)="ionKnobMoveStart.emit($event)"
      (ionKnobMoveEnd)="ionKnobMoveEnd.emit($event)"
    >
      <ng-content></ng-content>
    </ion-range>
  `,
  styles: []
})
export class RangeComponent implements AfterViewInit {
  @ViewChild(IonRange, { static: false }) ionRange?: IonRange;

  // Value properties
  @Input() min = 0;
  @Input() max = 100;
  @Input() value?: number | { lower: number; upper: number };
  @Input() step = 1;
  
  // Behavior properties
  @Input() snaps = false;
  @Input() pin = false;
  @Input() pinFormatter?: (value: number) => string | number;
  @Input() ticks = true;
  @Input() activeBarStart?: number;
  @Input() dualKnobs = false;
  @Input() debounce?: number;
  
  // Styling properties
  @Input() color?: string;
  @Input() mode?: 'ios' | 'md';
  
  // State properties
  @Input() disabled = false;
  
  // Label properties
  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked';
  
  // Form properties
  @Input() name?: string;
  
  // Events
  @Output() ionChange = new EventEmitter<CustomEvent>();
  @Output() ionInput = new EventEmitter<CustomEvent>();
  @Output() ionBlur = new EventEmitter<CustomEvent>();
  @Output() ionFocus = new EventEmitter<CustomEvent>();
  @Output() ionKnobMoveStart = new EventEmitter<CustomEvent>();
  @Output() ionKnobMoveEnd = new EventEmitter<CustomEvent>();

  ngAfterViewInit() {
    if (this.ionRange && this.pinFormatter) {
      this.ionRange.pinFormatter = this.pinFormatter;
    }
  }
}
