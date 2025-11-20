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
import { TextAreaComponent } from '../../shared/components/text-area/text-area.component';

import { getFormControl } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ReactiveFormsModule,
    InputComponent,
    TextAreaComponent,
    ButtonModule,
  ],
  providers: [],
  template: `
    <div class="contact-container">
      <app-card class="card">
        <ng-template #title>Contact Us</ng-template>
        <ng-template #content>
          <form [formGroup]="contactForm" (ngSubmit)="submit()">
            <div class="form-actions">
              <app-input
                [control]="getFormControl(contactForm, 'email')"
                label="Email"
              />
              <app-input
                [control]="getFormControl(contactForm, 'subject')"
                label="Subject"
              />
              <app-text-area
                [control]="getFormControl(contactForm, 'message')"
                label="Message"
              />
            </div>
          </form>
        </ng-template>
        <ng-template #footer>
          <p-button
            type="submit"
            label="Send"
            [disabled]="contactForm.invalid || loadingService.isLoading()"
            [loading]="loadingService.isLoading()"
            styleClass="w-full"
          >
          </p-button
        ></ng-template>
      </app-card>
    </div>
  `,
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected loadingService = inject(LoadingService);

  getFormControl = getFormControl;
  
  contactForm: FormGroup = new FormGroup({
    email: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
    subject: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    message: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  submit() {
    console.log('submitted');
  }
}
