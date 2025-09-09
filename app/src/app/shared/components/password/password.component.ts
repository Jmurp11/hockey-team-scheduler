import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

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
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-iftalabel>
          <p-password
            id="password"
            [formControlName]="fcName"
            [feedback]="false"
            [toggleMask]="true"
            [class.ng-invalid]="isInvalid(fcName)"
          >
          </p-password>
          <label for="password">{{ labelText() }}</label>
        </p-iftalabel>
        @if (isInvalid(fcName)) {
        <p-message severity="error" size="small" variant="simple"
          >Password is invalid</p-message
        >
        } @if (errorMessage.length > 0) {
        <p-message severity="error" size="small" variant="simple">{{
          errorMessage
        }}</p-message>
        }
      </div>
    </form>
  `,
  styleUrl: './password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  @Input()
  errorMessage: string = '';

  isInvalid(formControlName: string) {
    return (
      this.parentForm.get(formControlName)?.invalid &&
      this.parentForm.get(formControlName)?.touched
    );
  }

  checkIsConfirm() {
    return this.fcName === 'confirmPassword';
  }

  labelText() {
    return this.checkIsConfirm() ? 'Confirm Password' : 'Password';
  }
}
