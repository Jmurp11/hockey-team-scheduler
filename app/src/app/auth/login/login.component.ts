import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../shared/services/navigation.service';
import { CardComponent } from '../../shared/components/card/card.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingService } from '../../shared/services/loading.service';
import { ButtonModule } from 'primeng/button';
import { InputComponent } from '../../shared/components/input/input.component';
import { PasswordComponent } from '../../shared/components/password/password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ReactiveFormsModule,
    InputComponent,
    PasswordComponent,
    ButtonModule,
  ],
  providers: [LoadingService, NavigationService],
  template: `
    <div class="login-container">
      <app-card class="card">
        <ng-template #title>Login</ng-template>
        <ng-template #subtitle>Welcome back to IceTime.ai</ng-template>
        <ng-template #content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <app-input [parentForm]="loginForm" fcName="email" />

            <app-password
              [parentForm]="loginForm"
              fcName="password"
            />

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
            <a href="#" class="forgot-password">Forgot password?</a>
          </div>
        </ng-template>
      </app-card>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected loadingService = inject(LoadingService);
  navigation = inject(NavigationService);

  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  constructor() {}

  onSubmit() {}
}
