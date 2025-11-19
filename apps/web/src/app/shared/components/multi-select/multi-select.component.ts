import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';

import { MultiSelectParams } from '../../types/form-item.type';
import { inputId } from '../../utilities/form.utility';

@Component({
  selector: 'app-multi-select',
  imports: [
    CommonModule,
    IftaLabelModule,
    MultiSelectModule,
    MessageModule,
    ReactiveFormsModule,
    TooltipModule,
  ],
  template: `
    <div class="form-field">
      <div class="input-container">
        <p-iftalabel class="ng-dirty ng-invalid">
          <p-multiSelect
            [options]="options?.listItems"
            [formControl]="control"
            [id]="inputId(label)"
            [optionLabel]="options?.itemLabel"
            [filter]="options?.isAutoComplete"
            [filterBy]="options?.itemLabel"
            [placeholder]="options?.placeholder"
            [emptyMessage]="options!.emptyMessage"
            [showClear]="true"
            [maxSelectedLabels]="options?.maxSelectedLabels"
            [fluid]="options?.fluid"
          >
            <ng-template #selectedItem let-selectedOption>
              <div>{{ selectedOption[options!.itemLabel] }}</div>
            </ng-template>
            <ng-template let-option #item>
              <div>{{ option[options!.itemLabel] }}</div>
            </ng-template>
          </p-multiSelect>
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
        errorMessage
      }}</p-message>
      }
    </div>
  `,
  styleUrl: './multi-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectComponent<T> {
  @Input()
  control: FormControl;

  @Input()
  label: string;

  @Input() options: MultiSelectParams<T> | undefined;

  @Input() errorMessage: string;

  @Input() tooltip: string;

  inputId = inputId;
}
