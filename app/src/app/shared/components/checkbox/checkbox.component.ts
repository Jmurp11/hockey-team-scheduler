import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, CheckboxModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-checkbox
          [formControlName]="fcName"
          [binary]="true"
          [inputId]="fcName"
        />
      </div>
    </form>
  `,
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  constructor() {}
}
