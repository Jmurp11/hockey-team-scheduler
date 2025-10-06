import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { SliderModule } from 'primeng/slider';
@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, MessageModule, ReactiveFormsModule, SliderModule],
  template: `
      <div class="form-field">
        @if (isRange) {
        <p-slider
          [range]="true"
          [formControl]="control"
          [animate]="true"
          [min]="min"
          [max]="max"
        />
        } @else {
        <p-slider
          [step]="step"
          [formControl]="control"
          [animate]="true"
          [min]="min"
          [max]="max"
        />
        }
      </div>
  `,
  styleUrl: './slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent {
  @Input()
  control: FormControl;

  @Input()
  step?: number = 1;

  @Input()
  isRange: boolean;

  @Input()
  min: number;

  @Input()
  max: number;

  
}
