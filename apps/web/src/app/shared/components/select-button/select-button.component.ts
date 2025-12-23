import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectOption } from '@hockey-team-scheduler/shared-utilities';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-select-button',
  standalone: true,
  imports: [
    CommonModule,
    IftaLabelModule,
    SelectButtonModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
      <div class="form-field">
        <p-selectbutton
          [options]="options"
          [formControl]="control"
          optionLabel="label"
          optionValue="value"
        />
      </div>
  `,
  styleUrls: ['./select-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectButtonComponent {
  @Input()
  control: FormControl;

  @Input()
  options: SelectOption<any>[] = [];


}
