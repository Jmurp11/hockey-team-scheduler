import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { Manager } from '@hockey-team-scheduler/shared-utilities';
import { ContactHeaderComponent } from './contact-header/contact-header.component';
import { ContactContentComponent } from './contact-content/contact-content.component';
import { DialogComponent } from '../shared/components/dialog/dialog.component';
import { ContactSchedulerDialogService } from './contact-scheduler.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contact-scheduler',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    ContactHeaderComponent,
    ContactContentComponent,
    DialogComponent,
    ProgressSpinner,
  ],
  template: `
    @if (manager) {
      <app-dialog [visible]="contactSchedulerDialogService.isVisible()">
        <ng-template #header>
          <div class="dialog-header">
            <span><h2>Manager Details</h2></span>
          </div>
        </ng-template>

        <div class="container">
          <app-contact-header [manager]="manager" />
          <app-contact-content [manager]="manager" />
        </div>

        <ng-template #footer>
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="cancel()"
          />
        </ng-template>
      </app-dialog>
    } @else {
      <div class="loading-spinner">
        <p-progressSpinner />
      </div>
    }
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;
      .container {
        @include flex(flex-start, center, column);
        width: 100%;
        height: auto;
        padding: 2rem 0rem;
        gap: 1rem;
        text-align: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSchedulerComponent {
  @Input()
  manager: Manager;

  contactSchedulerDialogService = inject(ContactSchedulerDialogService);

  cancel() {
    this.contactSchedulerDialogService.closeDialog();
  }
}
