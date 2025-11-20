import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { inputId } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-text-area',
  standalone: true,
  imports: [
    CommonModule,
    IftaLabelModule,
    TextareaModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="form-field">
      <p-iftalabel>
        <textarea
          pTextarea
          [id]="inputId(label)"
          [formControl]="control"
          [class.ng-invalid]="isInvalid()"
          rows="5"
          cols="30"
          style="resize: none"
        ></textarea>

        <label [for]="inputId(label)">{{ label | titlecase }}</label>
      </p-iftalabel>
      @if (isInvalid()) {
      <p-message severity="error" size="small" variant="simple"
        >{{ label | titlecase }} is required.</p-message
      >
      }
    </div>
  `,
  styleUrl: './text-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAreaComponent {
  @Input()
  control: FormControl;

  @Input()
  label: string;

  inputId = inputId;

  isInvalid() {
    return this.control?.invalid && this.control?.touched;
  }
}
