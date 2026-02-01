import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {
  AuthService,
  GameMatchingStateService,
} from '@hockey-team-scheduler/shared-data-access';
import { GameMatchListComponent } from '@hockey-team-scheduler/shared-ui';

import {
  DatePickerComponent,
  DatePickerParams,
} from '../shared/components/date-picker/date-picker.component';
import { DialogComponent } from '../shared/components/dialog/dialog.component';
import { GameMatchingDialogService } from './game-matching-dialog.service';

@Component({
  selector: 'app-game-matching-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    DialogComponent,
    DatePickerComponent,
    GameMatchListComponent,
  ],
  template: `
    <app-dialog [visible]="dialogService.isVisible()">
      <ng-template #header>
        <div class="dialog-header">
          <span><h2>Find Opponents</h2></span>
        </div>
      </ng-template>

      <div class="game-matching-dialog">
        @if (matchingState.state() === 'idle' || matchingState.state() === 'loading') {
          <div class="game-matching-dialog__form">
            <p class="game-matching-dialog__instructions">
              Select a date range to find the best-matched opponents for your
              team.
            </p>
            <div class="game-matching-dialog__dates">
              <app-date-picker
                [control]="startDateControl"
                [datePickerParams]="startDateParams"
                label="Start Date"
              />
              <app-date-picker
                [control]="endDateControl"
                [datePickerParams]="endDateParams"
                label="End Date"
              />
            </div>
          </div>
        }

        @if (matchingState.state() === 'loading') {
          <div class="game-matching-dialog__loading">
            <p-progressSpinner
              ariaLabel="Finding opponents..."
              [style]="{ width: '50px', height: '50px' }"
            />
            <p>Finding the best opponents for your team...</p>
          </div>
        }

        @if (matchingState.state() === 'results' && matchingState.results()) {
          <lib-game-match-list
            [results]="matchingState.results()!"
            [searchingTeamId]="matchingState.searchingTeamId()"
            (findContact)="matchingState.handleFindContact($event)"
          />
        }

        @if (matchingState.state() === 'error') {
          <div class="game-matching-dialog__error">
            <i class="pi pi-exclamation-triangle"></i>
            <p>{{ matchingState.errorMessage() }}</p>
          </div>
        }
      </div>

      <ng-template #footer>
        @if (matchingState.state() === 'results') {
          <p-button
            label="Search Again"
            icon="pi pi-refresh"
            [text]="true"
            severity="secondary"
            (click)="matchingState.resetToForm()"
          />
        }
        <p-button
          label="Cancel"
          [text]="true"
          severity="secondary"
          (click)="cancel()"
        />
        @if (matchingState.state() === 'idle') {
          <p-button
            label="Find Matches"
            icon="bi bi-robot"
            [disabled]="!isFormValid()"
            (click)="search()"
          />
        }
      </ng-template>
    </app-dialog>
  `,
  styles: [
    `
      .game-matching-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        padding: 1rem 0;
        gap: 1rem;

        &__instructions {
          color: var(--text-color-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        &__form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        &__dates {
          display: flex;
          gap: 1rem;
          width: 100%;

          > * {
            flex: 1;
          }
        }

        &__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;

          p {
            color: var(--text-color-secondary);
            font-size: 0.875rem;
          }
        }

        &__error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          color: var(--red-500);

          i {
            font-size: 1.25rem;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMatchingDialogComponent {
  private authService = inject(AuthService);

  dialogService = inject(GameMatchingDialogService);
  matchingState = inject(GameMatchingStateService);

  startDateControl = new FormControl<Date | null>(null, Validators.required);
  endDateControl = new FormControl<Date | null>(null, Validators.required);

  private now = new Date();
  private oneYearFromNow = new Date(
    new Date().setFullYear(this.now.getFullYear() + 1),
  );

  startDateParams: DatePickerParams = {
    showIcon: true,
    minDate: this.now,
    maxDate: this.oneYearFromNow,
    placeholder: 'Select start date',
  };

  endDateParams: DatePickerParams = {
    showIcon: true,
    minDate: this.now,
    maxDate: this.oneYearFromNow,
    placeholder: 'Select end date',
  };

  isFormValid(): boolean {
    return (
      this.startDateControl.valid &&
      this.endDateControl.valid &&
      !!this.authService.currentUser()?.user_id
    );
  }

  search(): void {
    if (!this.isFormValid()) return;

    const startDate = this.formatDate(this.startDateControl.value!);
    const endDate = this.formatDate(this.endDateControl.value!);

    this.matchingState.search(startDate, endDate);
  }

  cancel(): void {
    this.matchingState.reset();
    this.startDateControl.reset();
    this.endDateControl.reset();
    this.dialogService.closeDialog();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
