import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { PasswordComponent } from '../../shared/components/password/password.component';

import { NavigationService } from '@hockey-team-scheduler/shared-ui';

import { UserService } from '@hockey-team-scheduler/shared-data-access';
import { getFormControl } from '@hockey-team-scheduler/shared-utilities';
import { AuthContainerComponent } from '../auth-container/auth-container.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    AuthContainerComponent,
    CardComponent,
    ReactiveFormsModule,
    InputComponent,
    PasswordComponent,
    ButtonModule,
  ],
  providers: [],
  template: `
    <app-auth-container>
      <app-card class="card">
        <ng-template #title>Login</ng-template>
        <ng-template #subtitle>Welcome back to RinkLink.ai</ng-template>
        <ng-template #content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <app-input [control]="getFormControl(loginForm, 'email')" label="Email" />

            <app-password [control]="getFormControl(loginForm, 'password')" label="Password" />

            <div class="form-actions">
              <p-button
                type="submit"
                label="Sign In"
                [disabled]="loginForm.invalid || loadingService.isLoading()"
                [loading]="loadingService.isLoading()"
                styleClass="w-full"
              >
              </p-button>
            </div>
          </form>
        </ng-template>
        <ng-template #footer>
          <div class="form-footer">
            <p>
              Don't have an account?
              <a (click)="navigation.navigateToLink('pricing')">Sign up</a>
            </p>
            <a
              (click)="navigation.navigateToLink('forgot-password')"
              class="forgot-password"
              >Forgot password?</a
            >
          </div>
        </ng-template>
      </app-card>
    </app-auth-container>
  `,
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  navigation = inject(NavigationService);

  getFormControl = getFormControl;

  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl(null, {
      validators: [Validators.required],
    }),
  });

  async onSubmit() {
    const data = await this.userService.login(
      this.loginForm.get('email')?.value,
      this.loginForm.get('password')?.value
    );

    if (data) {
      this.navigation.navigateToLink('/callback');
    }
  }
}
