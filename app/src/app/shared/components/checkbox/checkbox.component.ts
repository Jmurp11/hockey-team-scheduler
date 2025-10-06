import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, CheckboxModule, ReactiveFormsModule],
  template: `
    <div class="form-field">
      <p-checkbox [formControl]="control" [binary]="true" />
    </div>
  `,
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  @Input()
  control: FormControl;
}
