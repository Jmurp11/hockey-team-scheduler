import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { getFormControl } from '@hockey-team-scheduler/shared-utilities'
;
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import { UserService } from '@hockey-team-scheduler/shared-data-access';

@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [
    CommonModule,
    AuthContainerComponent,
    CardComponent,
    InputComponent,
    ButtonModule,
    ReactiveFormsModule,
  ],
  providers: [UserService],
  template: `
    <app-auth-container>
      @if (emailSent()) {
      <app-card class="card">
        <ng-template #title>Check your email!</ng-template>
        <ng-template #subtitle
          >We've sent you a magic link to log in. Please check your
          inbox.</ng-template
        >
      </app-card>
      } @else {
      <app-card class="card">
        <ng-template #title>Welcome to RinkLink.ai</ng-template>
        <ng-template #subtitle
          >Thank you for subscribing! Click the button below to have a login
          link sent to your email</ng-template
        >
        <ng-template #content>
          <form [formGroup]="newUserForm">
            <app-input
              [control]="getFormControl(newUserForm, 'email')"
              label="Email"
            />
            <div class="form-actions">
              <p-button
                [disabled]="newUserForm.invalid"
                label="Get Login Link"
                styleClass="w-full"
                (click)="magicLink()"
              />
            </div>
          </form>
        </ng-template>
        <ng-template #footer> </ng-template> </app-card
      >}
    </app-auth-container>
  `,
  styleUrls: ['./new-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewUserComponent {
  private userService = inject(UserService);

  emailSent = signal(false);

  newUserForm: FormGroup = new FormGroup({
    email: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
  });

  getFormControl = getFormControl;

  async magicLink() {
    let { data, error } = await this.userService.loginWithMagicLink(
      this.newUserForm.get('email')?.value
    );

    if (!error) {
      this.emailSent.set(true);
    }
  }
}
