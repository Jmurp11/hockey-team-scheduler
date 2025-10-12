import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { inputId } from '../../utilities/form.utility';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [
    CommonModule,
    IftaLabelModule,
    PasswordModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="form-field">
      <p-iftalabel>
        <p-password
          [id]="inputId(this.label)"
          [formControl]="control"
          [feedback]="false"
          [toggleMask]="true"
          [class.ng-invalid]="isInvalid()"
        >
        </p-password>
        <label for="password">{{ labelText() }}</label>
      </p-iftalabel>
      @if (isInvalid()) {
      <p-message severity="error" size="small" variant="simple"
        >Password is invalid</p-message
      >
      } @if (errorMessage.length > 0) {
      <p-message severity="error" size="small" variant="simple">{{
        errorMessage
      }}</p-message>
      }
    </div>
  `,
  styleUrls: ['./password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordComponent {
  @Input()
  control: FormControl;

  @Input()
  errorMessage: string = '';

  @Input()
  label: string;

  inputId = inputId;

  isInvalid() {
    return this.control?.invalid && this.control?.touched;
  }

  checkIsConfirm() {
    return this.inputId(this.label) === 'confirmPassword';
  }

  labelText() {
    return this.checkIsConfirm() ? 'Confirm Password' : 'Password';
  }
}
