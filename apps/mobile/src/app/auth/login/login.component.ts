import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserService } from '@hockey-team-scheduler/shared-data-access';
import {
  LoadingService,
  NavigationService,
} from '@hockey-team-scheduler/shared-ui';
import { getFormControl, initLoginForm } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonContent,
  IonText
} from '@ionic/angular/standalone';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { InputComponent } from '../../shared/input/input.component';
import { PasswordInputComponent } from '../../shared/password-input/password-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    CardComponent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    InputComponent,
    PasswordInputComponent,
    ButtonComponent,
  ],
  template: `
    <ion-content class="ion-padding" [scrollY]="true">
      <div class="auth-container">
        <app-card>
          <ion-card-header>
            <!-- <ion-card-title>Login</ion-card-title> -->
            <ion-card-subtitle>Welcome back to RinkLink.ai</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <app-input
                [formControl]="getFormControl(loginForm, 'email')"
                type="email"
                label="Email"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Enter your email"
                [required]="true"
              />

              <app-password-input
                [formControl]="getFormControl(loginForm, 'password')"
                label="Password"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Enter your password"
                [required]="true"
              />

              <div class="form-actions">
                <app-button
                  type="submit"
                  expand="block"
                  color="secondary"
                  [disabled]="loginForm.invalid || loadingService.isLoading()"
                >
                  {{ loadingService.isLoading() ? 'Signing in...' : 'Sign In' }}
                </app-button>
              </div>
            </form>

            <div class="form-footer">
              <ion-text color="medium">
                <p>
                  Don't have an account?
                  <a
                    (click)="navigation.navigateToLink('auth/pricing')"
                    (keyup.enter)="navigation.navigateToLink('auth/pricing')"
                    tabindex="0"
                    role="button"
                  >
                    Sign up
                  </a>
                </p>
              </ion-text>
              <ion-text color="medium">
                <a
                  (click)="navigation.navigateToLink('auth/forgot-password')"
                  (keyup.enter)="
                    navigation.navigateToLink('auth/forgot-password')
                  "
                  class="forgot-password"
                  tabindex="0"
                  role="button"
                >
                  Forgot password?
                </a>
              </ion-text>
            </div>
          </ion-card-content>
        </app-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: transparent;
        --keyboard-offset: 0px;
      }

      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100%;
        padding: 0.5rem;
        position: relative;
      }

      app-card {
        width: 100%;
        max-width: 600px;
        margin: 0;
        position: relative;
      }

      app-input {
        margin-bottom: 1rem;
        padding: 0rem 1rem 1rem 1rem;
      }

      app-password-input {
        margin-bottom: 1rem;
        padding: 0rem 1rem 1rem 1rem;
      }

      .form-actions {
        margin: 2rem 0 1.5rem 0;
      }

      .form-footer {
        text-align: center;
        margin-top: 1rem;

        p {
          margin: 0 0 1rem 0;

          a {
            color: var(--ion-color-primary);
            text-decoration: none;
            cursor: pointer;
            font-weight: 500;
          }
        }

        .forgot-password {
          color: var(--ion-color-primary);
          text-decoration: none;
          cursor: pointer;
          font-weight: 500;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  navigation = inject(NavigationService);

  getFormControl = getFormControl;

  loginForm: FormGroup = initLoginForm();

  async onSubmit() {
    const data = await this.userService.login(
      this.loginForm.get('email')?.value,
      this.loginForm.get('password')?.value,
    );

    if (data) {
      this.navigation.navigateToLink('/auth/callback');
    }
  }
}
