import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { inputId } from '@hockey-team-scheduler/shared-utilities';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-icon-field',
  standalone: true,
  imports: [
    CommonModule,
    IftaLabelModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    IconFieldModule,
    InputIconModule,
  ],
  template: `
    <div class="form-field">
      <p-iftalabel>
        <p-iconfield>
          <input
            pInputText
            [id]="inputId(label)"
            [formControl]="control"
            [class.ng-invalid]="isInvalid()"
          />
          <p-inputicon [class]="icon" (click)="iconAction()" />
        </p-iconfield>
        <label [for]="inputId(label)">{{ label | titlecase }}</label>
      </p-iftalabel>
      @if (isInvalid()) {
        <p-message severity="error" size="small" variant="simple"
          >{{ label | titlecase }} is required.</p-message
        >
      }
    </div>
  `,
  styleUrls: ['./icon-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconFieldComponent {
  @Input()
  control: FormControl;

  @Input()
  label: string;

  @Input()
  icon: string;

  @Input()
  iconAction: () => void;

  inputId = inputId;

  isInvalid() {
    return this.control?.invalid && this.control?.touched;
  }
}
