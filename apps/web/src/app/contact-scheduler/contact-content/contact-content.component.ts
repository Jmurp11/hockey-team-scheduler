import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { getFormControl, Manager, toTitleCase } from '@hockey-team-scheduler/shared-utilities';
import { IconFieldComponent } from '../../shared/components/icon-field/icon-field.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-contact-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconFieldComponent,
  ],
  template: `
    <div class="content">
      <form [formGroup]="form">
        @for (field of form.controls | keyvalue; track field.key) {
          <app-icon-field
            [control]="getFormControl(form, field.key)"
            [label]="field.key | titlecase"
            [icon]="'pi pi-copy'"
            [iconAction]="copy(field.key)"
          />
        }
      </form>
    </div>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .content {
        @include flex(center, center, column);
        width: 100%;
        height: auto;
        padding: 0rem 4rem;
        text-align: left;
      }

      app-icon-field {
        ::ng-deep .p-inputtext {
          background: #ffffff;
          color: black;
        }

        ::ng-deep .p-inputicon {
          color: var(--secondary-500);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactContentComponent {
  @Input()
  manager: Manager;

  private toastService = inject(ToastService);
  form: FormGroup;

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
    return () => {
      const value = this.form.get(fieldKey)?.value;
      if (value) {
        navigator.clipboard.writeText(value);
        this.toastService.presentToast({
          severity: 'success',
          summary: 'Copied to Clipboard',
          detail: `${toTitleCase(fieldKey)} copied to clipboard.`,
        });
      }
    };
  }
}
