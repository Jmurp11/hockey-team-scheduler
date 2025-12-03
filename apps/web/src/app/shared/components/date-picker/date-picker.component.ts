import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

import {
  convertTo12HourFormat,
  inputId,
} from '@hockey-team-scheduler/shared-utilities';

export interface DatePickerParams {
  showIcon: boolean;
  minDate: Date | null;
  maxDate: Date | null;
  placeholder?: string;
  errorMessage?: string;
  showTime?: boolean;
  hourFormat?: '12' | '24';
}

// TODO: bumping to primeng v20 will let us handle invalid form controls more easily
// TODO: Need to bump to Angular 20 to do this
@Component({
  selector: 'app-date-picker',
  imports: [
    CommonModule,
    IftaLabelModule,
    DatePickerModule,
    MessageModule,
    ReactiveFormsModule,
    TooltipModule,
  ],
  template: `
    <div class="form-field">
      <div class="input-container">
        <p-iftalabel>
          <p-datepicker
            showIcon
            [formControl]="control"
            [inputId]="inputId(label)"
            [iconDisplay]="'input'"
            [minDate]="minDate"
            [maxDate]="maxDate"
            [placeholder]="placeholder"
            [showTime]="showTime"
            [hourFormat]="hourFormat"
            [hideOnDateTimeSelect]="false"
            appendTo="body"
          />
          <label [for]="inputId(label)">{{ label }}</label>
        </p-iftalabel>

        @if (tooltip) {
          <i
            class="pi pi-question-circle tooltip-icon"
            [pTooltip]="tooltip"
            tooltipPosition="top"
          ></i>
        } @else {
          <span class="filler"> </span>
        }
      </div>

      @if (control.invalid && (control.dirty || control.touched)) {
        <p-message severity="error" size="small" variant="simple">{{
          datePickerParams?.errorMessage
        }}</p-message>
      }
    </div>
  `,
  styleUrl: './date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent implements OnInit {
  @Input()
  control: FormControl;

  @Input()
  label: string;

  @Input()
  datePickerParams: DatePickerParams | undefined;

  @Input() tooltip: string;

  inputId = inputId;

  minDate: Date;

  maxDate: Date;

  placeholder: string;
  showTime: boolean;
  hourFormat: '12' | '24';

  /**
   *
   */
  ngOnInit(): void {
    this.minDate = this.datePickerParams?.minDate || new Date();
    this.maxDate = this.datePickerParams?.maxDate || new Date();
    this.placeholder = this.datePickerParams?.placeholder || '';
    this.showTime = !!this.datePickerParams?.showTime;
    this.hourFormat = this.datePickerParams?.hourFormat || '12';

    if (this.control.value) {
      this.placeholder = this.formatPlaceholder(this.control.value);
    }
  }

  formatPlaceholder(date: string): string {
    let newDate = date.split('T')[0];
    let time = date.split('T')[1];

    return `${newDate} ${convertTo12HourFormat(time)}`;
  }
}
