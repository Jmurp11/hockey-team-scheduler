import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ContactService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
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
    ToastModule,
  ],
  providers: [MessageService],
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
            (click)="submit()"
          >
          </p-button
        ></ng-template>
      </app-card>
    </div>
    <p-toast />
  `,
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected loadingService = inject(LoadingService);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

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
    if (this.contactForm.invalid) {
      return;
    }

    this.loadingService.setLoading(true);

    const { email, subject, message } = this.contactForm.value;

    this.contactService
      .sendContactForm({ email, subject, message })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadingService.setLoading(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Message Sent',
            detail: 'Thank you for contacting us! We will get back to you soon.',
          });
          this.contactForm.reset();
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to send message. Please try again later.',
          });
        },
      });
  }
}
