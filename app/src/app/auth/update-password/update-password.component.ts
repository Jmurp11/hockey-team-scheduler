import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { PasswordComponent } from '../../shared/components/password/password.component';
import { LoadingService } from '../../shared/services/loading.service';
import { NavigationService } from '../../shared/services/navigation.service';
import { UserService } from '../user.service';
import { confirmPasswordValidator } from './password-match.validator';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ReactiveFormsModule,
    PasswordComponent,
    ButtonModule,
  ],
  providers: [LoadingService, NavigationService, UserService],
  template: `
    <div class="password-container">
      <app-card class="card">
        <ng-template #title>Reset Password</ng-template>
        <ng-template #subtitle>Reset your password for IceTime.ai</ng-template>
        <ng-template #content>
          <form [formGroup]="updatePassword" (ngSubmit)="onSubmit()">
            <app-password [parentForm]="updatePassword" fcName="password" />

            <app-password
              [parentForm]="updatePassword"
              fcName="confirmPassword"
              [errorMessage]="passwordErrorMessage()"
            />

            <div class="form-actions">
              <p-button
                type="submit"
                label="Reset Password"
                [disabled]="
                  updatePassword.invalid || loadingService.isLoading()
                "
                [loading]="loadingService.isLoading()"
                styleClass="w-full"
              >
              </p-button>
            </div>
          </form>
        </ng-template>
        <ng-template #footer> </ng-template>
      </app-card>
    </div>
  `,
  styleUrls: ['./update-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdatePasswordComponent {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  navigation = inject(NavigationService);
  
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
      console.log('Passwords do not match.');
      return 'Passwords do not match.';
    }
    return '';
  }
}
