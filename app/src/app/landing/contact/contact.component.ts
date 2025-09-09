import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { TextAreaComponent } from '../../shared/components/text-area/text-area.component';
import { InputComponent } from '../../shared/components/input/input.component';

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
  providers: [LoadingService],
  template: `
    <div class="contact-container">
      <app-card class="card">
        <ng-template #title>Contact Us</ng-template>
        <ng-template #content>
          <form [formGroup]="contactForm" (ngSubmit)="submit()">
            <div class="form-actions">
              <app-input [parentForm]="contactForm" fcName="email" />
              <app-input [parentForm]="contactForm" fcName="subject" />
              <app-text-area [parentForm]="contactForm" fcName="message" />
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
