import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  TemplateRef,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  template: `
    <p-dialog [(visible)]="visible" [modal]="true" [closable]="false" class="dialog">
      <ng-template pTemplate="header"
        ><ng-container *ngTemplateOutlet="header"></ng-container
      ></ng-template>
      <ng-content></ng-content>
      <ng-template pTemplate="footer"
        ><ng-container *ngTemplateOutlet="footer"></ng-container
      ></ng-template>
    </p-dialog>
  `,
  styleUrls: ['./dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  @Input() visible: boolean;
  @ContentChild('header') header: TemplateRef<any> | undefined;
  @ContentChild('footer') footer: TemplateRef<any> | undefined;

  ngOnInit() {
    console.log('visible', this.visible);
  }
}
