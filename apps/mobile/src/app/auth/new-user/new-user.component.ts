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
import { UserService } from '@hockey-team-scheduler/shared-data-access';
import { getFormControl } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { InputComponent } from '../../shared/input/input.component';

@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    CardComponent,
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
        @if (emailSent()) {
          <app-card>
            <ion-card-header>
              <ion-card-title>Check your email!</ion-card-title>
              <ion-card-subtitle>
                We've sent you a magic link to log in. Please check your inbox.
              </ion-card-subtitle>
            </ion-card-header>
          </app-card>
        } @else {
          <app-card>
            <ion-card-header>
              <ion-card-title>Welcome to RinkLink.ai</ion-card-title>
              <ion-card-subtitle>
                Thank you for subscribing! Click the button below to have a login
                link sent to your email
              </ion-card-subtitle>
            </ion-card-header>

            <ion-card-content>
              <form [formGroup]="newUserForm">
                <app-input
                  [formControl]="getFormControl(newUserForm, 'email')"
                  type="email"
                  label="Email"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder="Enter your email"
                  [required]="true"
                />

                <div class="form-actions">
                  <app-button
                    expand="block"
                    color="primary"
                    [disabled]="newUserForm.invalid"
                    (onClick)="magicLink()"
                  >
                    Get Login Link
                  </app-button>
                </div>
              </form>
            </ion-card-content>
          </app-card>
        }
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

    app-card {
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
    const { error } = await this.userService.loginWithMagicLink(
      this.newUserForm.get('email')?.value
    );

    if (!error) {
      this.emailSent.set(true);
    }
  }
}
