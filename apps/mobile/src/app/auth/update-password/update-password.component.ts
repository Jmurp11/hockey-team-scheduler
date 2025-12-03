import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService, NavigationService } from '@hockey-team-scheduler/shared-ui';
import { confirmPasswordValidator, getFormControl } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonText,
} from '@ionic/angular/standalone';
import { ButtonComponent } from '../../shared/button/button.component';
import { PasswordInputComponent } from '../../shared/password-input/password-input.component';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    PasswordInputComponent,
    ButtonComponent,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="auth-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Reset Password</ion-card-title>
            <ion-card-subtitle>Reset your password for RinkLink.ai</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <form [formGroup]="updatePassword" (ngSubmit)="onSubmit()">
              <app-password-input
                [formControl]="getFormControl(updatePassword, 'password')"
                label="New Password"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Enter new password (min 10 characters)"
                [required]="true"
              />

              <app-password-input
                [formControl]="getFormControl(updatePassword, 'confirmPassword')"
                label="Confirm Password"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Confirm your password"
                [required]="true"
              />

              @if (passwordErrorMessage()) {
                <ion-text color="danger">
                  <p class="error-message">{{ passwordErrorMessage() }}</p>
                </ion-text>
              }

              <div class="form-actions">
                <app-button
                  type="submit"
                  expand="block"
                  color="primary"
                  [disabled]="updatePassword.invalid || loadingService.isLoading()"
                >
                  {{ loadingService.isLoading() ? 'Resetting...' : 'Reset Password' }}
                </app-button>
              </div>
            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: transparent;
    }

    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
      padding: 1rem;
    }

    ion-card {
      width: 100%;
      max-width: 600px;
      margin: 0;
    }

    app-password-input {
      margin-bottom: 1rem;
    }

    .error-message {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
    }

    .form-actions {
      margin: 2rem 0 1rem 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdatePasswordComponent {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  navigation = inject(NavigationService);

  getFormControl = getFormControl;

  updatePassword: FormGroup = new FormGroup(
    {
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
      ]),
    },
    { validators: confirmPasswordValidator }
  );

  async onSubmit() {
    const data = await this.userService.updatePassword(
      this.updatePassword.get('password')?.value
    );

    if (data) {
      this.navigation.navigateToLink('/app/dashboard');
    }
  }

  passwordErrorMessage(): string {
    if (
      this.updatePassword.get('password')?.touched &&
      this.updatePassword.get('confirmPassword')?.touched &&
      this.updatePassword.errors?.['mismatchPassword']
    ) {
      return 'Passwords do not match.';
    }
    return '';
  }
}
