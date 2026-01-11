import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import {
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '@hockey-team-scheduler/shared-data-access';
import { getFormControl, initMagicLinkForm } from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { AuthContainerComponent } from '../auth-container/auth-container.component';

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
        <ng-template #title>{{ isInvitedUser() ? 'Complete Your Registration' : 'Welcome to RinkLink.ai' }}</ng-template>
        <ng-template #subtitle>
          {{ isInvitedUser() 
            ? 'Your invitation has been accepted! Request a magic link below to complete your profile setup.' 
            : 'Thank you for subscribing! Click the button below to have a login link sent to your email' 
          }}
        </ng-template>
        <ng-template #content>
          <form [formGroup]="newUserForm">
            <app-input
              [control]="getFormControl(newUserForm, 'email')"
              label="Email"
            />
            <div class="form-actions">
              <p-button
                [disabled]="newUserForm.invalid || loading()"
                [loading]="loading()"
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
export class NewUserComponent implements OnInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  emailSent = signal(false);
  isInvitedUser = signal(false);
  loading = signal(false);

  newUserForm: FormGroup = initMagicLinkForm();

  getFormControl = getFormControl;

  ngOnInit() {
    // Check for invited user flow
    const invited = this.route.snapshot.queryParams['invited'];
    const email = this.route.snapshot.queryParams['email'];
    
    // Also check sessionStorage for email (set during invite acceptance)
    const storedEmail = sessionStorage.getItem('invitedEmail');
    
    if (invited === 'true') {
      this.isInvitedUser.set(true);
    }
    
    // Pre-fill email from query param or sessionStorage
    const emailToUse = email || storedEmail;
    if (emailToUse) {
      this.newUserForm.get('email')?.setValue(emailToUse);
      // Clear stored email after using it
      if (storedEmail) {
        sessionStorage.removeItem('invitedEmail');
      }
    }
  }

  async magicLink() {
    this.loading.set(true);
    
    const { error } = await this.userService.loginWithMagicLink(
      this.newUserForm.get('email')?.value
    );

    this.loading.set(false);
    
    if (!error) {
      this.emailSent.set(true);
    }
  }
}
