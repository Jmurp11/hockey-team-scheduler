import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  getFormControl,
  Manager,
  toTitleCase,
} from '@hockey-team-scheduler/shared-utilities';
import { ToastService } from '../../shared/toast/toast.service';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copyOutline } from 'ionicons/icons';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-contact-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    IonIcon,
  ],
  template: `
    <div class="content">
      <form [formGroup]="form">
        @for (field of form.controls | keyvalue; track field.key) {
          <div class="icon-field">
            <app-input
              [formControl]="getFormControl(form, field.key)"
              [label]="field.key | titlecase"
              [type]="'text'"
              [labelPlacement]="'stacked'"
              [fill]="'outline'"
            />
            <app-button
              [color]="'secondary'"
              (click)="copy(field.key)"
              [fill]="'clear'"
              [size]="'small'"
            >
              <ion-icon
                slot="icon-only"
                [name]="'copy-outline'"
                [color]="'secondary'"
              />
            </app-button>
          </div>
        }
      </form>
    </div>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      :host {
        width: 100%;
      }

      form {
        width: 100%;
      }

      .content {
        @include flex(center, center, column);
        width: 100% !important;
        height: auto;
        padding: 0rem 2rem;
      }

      .icon-field {
        @include flex(center, center, row);
        width: 100%;
        padding: 0.5rem 0rem;
        app-input {
          flex: 1;
          text-align: left;
        }

        app-button {
          margin-left: 0.5rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactContentComponent {
  @Input()
  manager!: Manager;

  private toastService = inject(ToastService);
  form!: FormGroup;

  constructor() {
    addIcons({ copyOutline });
  }

  getFormControl = getFormControl;

  ngOnInit() {
    this.form = new FormGroup({
      phone: new FormControl(this.manager.phone),
      email: new FormControl(this.manager.email),
      url: new FormControl(this.manager.sourceUrl),
    });

    this.form.disable();
  }

  copy(fieldKey: string) {
    const value = this.form.get(fieldKey)?.value;
    if (value) {
      Clipboard.write({ string: value });
      this.toastService.presentToast(
        `${toTitleCase(fieldKey)} copied to clipboard.`,
        2000,
        'bottom',
        'success',
      );
    }
  }
}
