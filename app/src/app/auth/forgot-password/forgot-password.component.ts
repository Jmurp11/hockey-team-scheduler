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
import { InputComponent } from '../../shared/components/input/input.component';
import { LoadingService } from '../../shared/services/loading.service';
import { NavigationService } from '../../shared/services/navigation.service';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { UserService } from '../user.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    AuthContainerComponent,
    CardComponent,
    ReactiveFormsModule,
    InputComponent,
    ButtonModule,
  ],
  providers: [LoadingService, NavigationService, UserService],
  template: `
    <app-auth-container>
      <app-card class="card">
        <ng-template #title>Reset Password</ng-template>
        <ng-template #subtitle>Reset your password for IceTime.ai</ng-template>
        <ng-template #content>
          <form [formGroup]="forgotPassword" (ngSubmit)="onSubmit()">
            <app-input [parentForm]="forgotPassword" fcName="email" />
            <div class="form-actions">
              <p-button
                type="submit"
                label="Send Reset Link"
                [disabled]="
                  forgotPassword.invalid || loadingService.isLoading()
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
    </app-auth-container>
  `,
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  protected loadingService = inject(LoadingService);
  private userService = inject(UserService);
  navigation = inject(NavigationService);

  forgotPassword: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  async onSubmit() {
    this.userService.sendPasswordResetEmail(this.forgotPassword.value.email);
    this.navigation.navigateToLink('login');
  }
}
