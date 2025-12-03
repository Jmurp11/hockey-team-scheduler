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
import { getFormControl } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';

@Component({
  selector: 'app-forgot-password',
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
    InputComponent,
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
            <form [formGroup]="forgotPassword" (ngSubmit)="onSubmit()">
              <app-input
                [formControl]="getFormControl(forgotPassword, 'email')"
                type="email"
                label="Email"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Enter your email"
                [required]="true"
              />

              <div class="form-actions">
                <app-button
                  type="submit"
                  expand="block"
                  color="primary"
                  [disabled]="forgotPassword.invalid || loadingService.isLoading()"
                >
                  {{ loadingService.isLoading() ? 'Sending...' : 'Send Reset Link' }}
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

    app-input {
      margin-bottom: 1rem;
    }

    .form-actions {
      margin: 2rem 0 1rem 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  navigation = inject(NavigationService);

  getFormControl = getFormControl;

  forgotPassword: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  async onSubmit() {
    this.userService.sendPasswordResetEmail(this.forgotPassword.value.email);
    this.navigation.navigateToLink('login');
  }
}
