import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { BugReportStateService } from '@hockey-team-scheduler/shared-data-access';
import { getFormControl } from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../shared/components/card/card.component';
import { InputComponent } from '../shared/components/input/input.component';
import { TextAreaComponent } from '../shared/components/text-area/text-area.component';

@Component({
  selector: 'app-bug-report',
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
    <main class="bug-report-container">
      <app-card class="card">
        <ng-template #title>Report a Bug</ng-template>
        <ng-template #content>
          <form [formGroup]="bugReportState.form" (ngSubmit)="submit()">
            <div class="form-actions">
              <app-input
                [control]="getFormControl(bugReportState.form, 'email')"
                label="Email"
              />
              <app-input
                [control]="getFormControl(bugReportState.form, 'subject')"
                label="Subject"
              />
              <app-text-area
                [control]="getFormControl(bugReportState.form, 'message')"
                label="Describe the bug"
              />
            </div>
          </form>
        </ng-template>
        <ng-template #footer>
          <p-button
            type="submit"
            label="Submit Bug Report"
            [disabled]="bugReportState.form.invalid || bugReportState.loading()"
            [loading]="bugReportState.loading()"
            styleClass="w-full"
            (click)="submit()"
          />
        </ng-template>
      </app-card>
    </main>
    <p-toast />
  `,
  styles: [
    `
      .bug-report-container {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 2rem;
        flex: 1;
      }

      .card {
        width: 100%;
        max-width: 600px;
        border-radius: 12px;
      }

      p-button {
        width: 350px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BugReportComponent implements OnDestroy {
  protected bugReportState = inject(BugReportStateService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  getFormControl = getFormControl;

  submit(): void {
    const result$ = this.bugReportState.submit();
    if (!result$) return;

    result$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Bug Report Sent',
          detail: 'Thank you for your report! We will look into it.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send bug report. Please try again later.',
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.bugReportState.reset();
  }
}
