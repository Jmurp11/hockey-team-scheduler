import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [
    CommonModule,
    IftaLabelModule,
    SelectModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-select
          [options]="items"
          [(ngModel)]="selectedCountry"
          optionLabel="label"
          [placeholder]=""
          class="w-full md:w-56"
        >
          <ng-template #selectedItem let-selectedOption>
                <div>{{ selectedOption.label }}</div>
          </ng-template>
          <ng-template let-item #item>
              <div>{{ item.label }}</div>
            </div>
          </ng-template>
          <ng-template #dropdownicon>
            <i class="pi pi-chevron-down"></i>
          </ng-template>
          <ng-template #header>
            <ng-container *ngTemplateOutlet="header"></ng-container>
          </ng-template>
          <ng-template #footer>
            <ng-container *ngTemplateOutlet="footer"></ng-container>
          </ng-template>
        </p-select>
      </div>
    </form>
  `,
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  @Input()
  options: { label: string; value: string }[] = [];

  isInvalid(formControlName: string) {
    return (
      this.parentForm.get(formControlName)?.invalid &&
      this.parentForm.get(formControlName)?.touched
    );
  }
}
