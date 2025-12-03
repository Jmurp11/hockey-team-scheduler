import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { inputId } from '@hockey-team-scheduler/shared-utilities';

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
    <div class="form-field">
      <p-iftalabel>
        <input
          pInputText
          [id]="inputId(label)"
          [formControl]="control"
          [class.ng-invalid]="isInvalid()"
        />
        <label [for]="inputId(label)">{{ label | titlecase }}</label>
      </p-iftalabel>
      @if (isInvalid()) {
      <p-message severity="error" size="small" variant="simple"
        >{{ label | titlecase }} is required.</p-message
      >
      }
    </div>
  `,
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  @Input()
  control: FormControl;

  @Input()
  label: string

  inputId = inputId;
  
  isInvalid() {
    return this.control?.invalid && this.control?.touched;
  }
}
