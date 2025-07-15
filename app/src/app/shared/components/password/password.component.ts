import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';

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
          <label for="password">Password</label>
        </p-iftalabel>
        @if (isInvalid(fcName)) {
        <p-message severity="error" size="small" variant="simple"
          >Password is required.</p-message
        >
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

  constructor() {}

  isInvalid(formControlName: string) {
    return (
      this.parentForm.get(formControlName)?.invalid &&
      this.parentForm.get(formControlName)?.touched
    );
  }
}
