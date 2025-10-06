import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SelectParams } from '../../types/form-item.type';
import { inputId } from '../../utilities/form.utility';

@Component({
  selector: 'app-select',
  imports: [
    CommonModule,
    IftaLabelModule,
    SelectModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="form-field">
      <p-iftalabel>
        <p-select
          [options]="options?.listItems"
          [formControl]="control"
          [id]="inputId(label)"
          [optionLabel]="options?.itemLabel"
          [filter]="options?.isAutoComplete"
          [filterBy]="options?.itemLabel"
          [placeholder]="options?.placeholder"
          [emptyMessage]="options!.emptyMessage"
          [showClear]="true"
        >
          <ng-template #selectedItem let-selectedOption>
            <div>{{ selectedOption[options!.itemLabel] }}</div>
          </ng-template>
          <ng-template let-option #item>
            <div>{{ option[options!.itemLabel] }}</div>
          </ng-template>
        </p-select>
        <label [for]="inputId(label)">{{ label }}</label>
      </p-iftalabel>
      @if (control.invalid && (control.dirty || control.touched)) {
      <p-message severity="error" size="small" variant="simple"
        >Required</p-message
      >
      }
    </div>
  `,
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent<T> {
  @Input()
  control: FormControl;

  @Input()
  label: string;

  @Input() options: SelectParams<T> | undefined;

  inputId = inputId;
}
