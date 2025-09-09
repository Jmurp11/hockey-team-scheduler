import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';

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
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-selectbutton
          [options]="options"
          [formControlName]="fcName"
          optionLabel="label"
          optionValue="value"
        />
      </div>
    </form>
  `,
  styleUrls: ['./select-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectButtonComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  @Input()
  options: { label: string; value: string }[] = [];

  constructor() {}

  isInvalid(formControlName: string) {
    return (
      this.parentForm.get(formControlName)?.invalid &&
      this.parentForm.get(formControlName)?.touched
    );
  }
}
