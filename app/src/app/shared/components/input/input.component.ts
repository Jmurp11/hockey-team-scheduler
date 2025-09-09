import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    IftaLabelModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-iftalabel>
          <input
            pInputText
            [id]="fcName"
            [formControlName]="fcName"
            [class.ng-invalid]="isInvalid(fcName)"
          />
          <label [for]="fcName">{{ fcName | titlecase }}</label>
        </p-iftalabel>
        @if (isInvalid(fcName)) {
        <p-message severity="error" size="small" variant="simple"
          >{{ fcName | titlecase }} is required.</p-message
        >
        }
      </div>
    </form>
  `,
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  constructor() {}

  isInvalid(formControlName: string) {
    return (
      this.parentForm.get(formControlName)?.invalid &&
      this.parentForm.get(formControlName)?.touched
    );
  }
}
