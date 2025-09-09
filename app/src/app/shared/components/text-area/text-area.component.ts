import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';

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
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-iftalabel>
          <textarea
            pTextarea
            id="description"
            [formControlName]="fcName"
            [class.ng-invalid]="isInvalid(fcName)"
            rows="5"
            cols="30"
            style="resize: none"
          ></textarea>

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
  styleUrl: './text-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAreaComponent {
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
