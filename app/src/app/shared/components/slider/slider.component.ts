import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { SliderModule } from 'primeng/slider';
@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, MessageModule, ReactiveFormsModule, SliderModule],
  template: `
    <form [formGroup]="parentForm">
      <div class="form-field">
        @if (isRange) {
        <p-slider
          [range]="true"
          [formControlName]="fcName"
          [animate]="true"
          [min]="min"
          [max]="max"
        />
        } @else {
        <p-slider
          [step]="step"
          [formControlName]="fcName"
          [animate]="true"
          [min]="min"
          [max]="max"
        />
        }
      </div>
    </form>
  `,
  styleUrl: './slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  @Input()
  step?: number = 1;

  @Input()
  isRange: boolean;

  @Input()
  min: number;

  @Input()
  max: number;

  constructor() {}
}
