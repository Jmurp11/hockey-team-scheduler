import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DeveloperPortalService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SeoService } from '../../shared/services/seo.service';

/**
 * Developer Login Component
 *
 * Handles magic link authentication for the Developer Portal.
 * Users enter their email and receive a login link.
 *
 * Flow:
 * 1. User enters email
 * 2. System sends magic link email
 * 3. User clicks link and is authenticated
 */
@Component({
  selector: 'app-developer-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardComponent,
    InputComponent,
    ToastModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <app-card class="login-card">
        <ng-template #title>
          <h2>Developer Portal Login</h2>
        </ng-template>
        <ng-template #content>
          @if (linkSent()) {
            <!-- Link Sent State -->
            <div class="link-sent">
              <div class="icon">
                <i class="pi pi-envelope"></i>
              </div>
              <h3>Check Your Email</h3>
              <p>
                We've sent a login link to <strong>{{ submittedEmail() }}</strong>.
                Click the link in the email to sign in.
              </p>
              <p class="note">
                The link will expire in 15 minutes. Check your spam folder if you
                don't see it.
              </p>
              <p-button
                label="Send Another Link"
                variant="text"
                (onClick)="resetForm()"
              />
            </div>
          } @else {
            <!-- Login Form -->
            <p class="description">
              Enter your email address and we'll send you a magic link to sign in.
            </p>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <app-input
                [control]="emailControl"
                label="Email Address"
                placeholder="developer@example.com"
              />

              <p-button
                type="submit"
                label="Send Login Link"
                icon="pi pi-send"
                [disabled]="loadingService.isLoading() || loginForm.invalid"
                [loading]="loadingService.isLoading()"
                size="large"
                class="submit-button"
              />
            </form>

            <div class="signup-prompt">
              <p>Don't have an account?</p>
              <a (click)="navigateToSignup()">Sign up for API access</a>
            </div>
          }
        </ng-template>
      </app-card>
    </div>
    <p-toast />
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .login-container {
        max-width: 450px;
        margin: 4rem auto;
        padding: 0 1rem;
      }

      .login-card {
        :host ::ng-deep .p-card-body {
          padding: 2rem;
        }

        h2 {
          text-align: center;
          color: var(--primary-700);
          margin: 0;
        }

        .description {
          text-align: center;
          color: var(--text-color-secondary);
          margin-bottom: 2rem;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .submit-button {
          width: 100%;

          ::ng-deep .p-button {
            width: 100%;
            justify-content: center;
          }
        }

        .signup-prompt {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--surface-border);

          p {
            margin: 0 0 0.5rem;
            font-size: 0.875rem;
            color: var(--text-color-secondary);
          }

          a {
            color: var(--primary-500);
            cursor: pointer;
            text-decoration: underline;

            &:hover {
              color: var(--primary-700);
            }
          }
        }

        .link-sent {
          text-align: center;
          padding: 1rem 0;

          .icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: var(--primary-100);
            @include flex(center, center, row);
            margin: 0 auto 1.5rem;

            i {
              font-size: 2rem;
              color: var(--primary-500);
            }
          }

          h3 {
            color: var(--primary-700);
            margin-bottom: 1rem;
          }

          p {
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
            line-height: 1.6;

            strong {
              color: var(--text-color);
            }
          }

          .note {
            font-size: 0.875rem;
            margin-top: 1rem;
            margin-bottom: 1.5rem;
          }
        }
      }
    `,
  ],
})
export class DeveloperLoginComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  private developerPortalService = inject(DeveloperPortalService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private seoService = inject(SeoService);

  linkSent = signal(false);
  submittedEmail = signal('');

  loginForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
  });

  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Developer Login - RinkLink.ai API Access',
      description:
        'Sign in to your RinkLink.ai developer account to access your API dashboard, manage API keys, and view usage statistics.',
      url: 'https://rinklink.ai/developer/login',
      robots: 'noindex, nofollow', // Login pages should not be indexed
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.requestMagicLink();
  }

  private requestMagicLink(): void {
    const email = this.loginForm.value.email || '';
    this.loadingService.setLoading(true);

    this.developerPortalService
      .requestMagicLink({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadingService.setLoading(false);
          this.submittedEmail.set(email);
          this.linkSent.set(true);
        },
        error: () => {
          this.loadingService.setLoading(false);
          // Still show success to prevent email enumeration
          this.submittedEmail.set(email);
          this.linkSent.set(true);
        },
      });
  }

  resetForm(): void {
    this.linkSent.set(false);
    this.submittedEmail.set('');
    this.loginForm.reset();
  }

  navigateToSignup(): void {
    this.router.navigate(['/developer/signup']);
  }
}
