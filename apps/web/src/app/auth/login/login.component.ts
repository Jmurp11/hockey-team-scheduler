import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { LoadingService, NavigationService } from '@hockey-team-scheduler/shared-ui';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { PasswordComponent } from '../../shared/components/password/password.component';

import { UserService } from '@hockey-team-scheduler/shared-data-access';
import { getFormControl, initLoginForm } from '@hockey-team-scheduler/shared-utilities';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { SeoService } from '../../shared/services/seo.service';

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
    ProgressSpinnerModule,
  ],
  providers: [],
  template: `
    <app-auth-container>
      <app-card class="card">
        <ng-template #title>Login</ng-template>
        <ng-template #subtitle>Welcome back to RinkLink.ai</ng-template>
        <ng-template #content>
          <!-- Loading overlay -->
          @if (isSigningIn()) {
            <div class="loading-overlay">
              <div class="loading-content">
                <p-progressspinner
                  [style]="{width: '40px', height: '40px'}"
                  strokeWidth="4"
                  animationDuration="1s"
                />
                <span class="loading-text">Signing you in...</span>
              </div>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <app-input [control]="getFormControl(loginForm, 'email')" label="Email" />

            <app-password [control]="getFormControl(loginForm, 'password')" label="Password" />

            <div class="form-actions">
              <p-button
                type="submit"
                label="Sign In"
                [disabled]="loginForm.invalid || loadingService.isLoading() || isSigningIn()"
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
export class LoginComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  private seoService = inject(SeoService);
  navigation = inject(NavigationService);

  getFormControl = getFormControl;

  // Local loading state for sign-in animation
  isSigningIn = signal<boolean>(false);

  loginForm: FormGroup = initLoginForm();

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Login - RinkLink.ai Hockey Team Management',
      description:
        'Sign in to RinkLink.ai to access your hockey team schedule, manage games, find opponents, and discover tournaments. Secure login for team managers.',
      url: 'https://rinklink.ai/login',
      keywords:
        'hockey login, team management login, rinklink signin, hockey scheduling login',
      robots: 'noindex, nofollow', // Login pages should not be indexed
    });
  }

  async onSubmit() {
    if (this.isSigningIn()) {
      return;
    }

    this.isSigningIn.set(true);

    try {
      const data = await this.userService.login(
        this.loginForm.get('email')?.value,
        this.loginForm.get('password')?.value
      );

      if (data) {
        // Keep the loading state while navigating
        this.navigation.navigateToLink('/callback');
      } else {
        this.isSigningIn.set(false);
      }
    } catch {
      this.isSigningIn.set(false);
    }
  }
}
