import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-icon-select-button',
  standalone: true,
  imports: [
    CommonModule,
    SelectButtonModule,
    MessageModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="form-field">
      <p-selectbutton
        [options]="options"
        [formControl]="control"
        optionLabel="value"
        optionValue="value"
      >
        <ng-template #item let-item> <i [class]="item.icon"></i> </ng-template
      ></p-selectbutton>
    </div>
  `,
  styleUrls: ['./icon-select-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconSelectButtonComponent {
  @Input()
  control: FormControl;

  @Input()
  options: { icon: string; value: string }[] = [];
}
