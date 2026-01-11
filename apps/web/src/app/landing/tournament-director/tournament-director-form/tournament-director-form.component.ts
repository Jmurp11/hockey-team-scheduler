import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import {
  CreateTournamentDto,
  getFormControl,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../../shared/components/card/card.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { MultiSelectComponent } from '../../../shared/components/multi-select/multi-select.component';
import { TextAreaComponent } from '../../../shared/components/text-area/text-area.component';

/**
 * Form component for tournament director submissions.
 * Emits form data to parent for submission handling.
 */
@Component({
  selector: 'app-tournament-director-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    InputComponent,
    DatePickerComponent,
    MultiSelectComponent,
    TextAreaComponent,
    ButtonModule,
  ],
  template: `
    <app-card class="form-card">
      <ng-template #title>Tournament Details</ng-template>
      <ng-template #content>
        <form [formGroup]="tournamentForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <!-- Tournament Name -->
            <div class="form-field-full">
              <app-input
                [control]="getFormControl(tournamentForm, 'name')"
                label="Tournament Name"
              />
            </div>

            <!-- Email Address -->
            <div class="form-field-full">
              <app-input
                [control]="getFormControl(tournamentForm, 'email')"
                label="Your Email Address"
              />
            </div>

            <!-- Location -->
            <div class="form-field-full">
              <app-input
                [control]="getFormControl(tournamentForm, 'location')"
                label="Location (City, State)"
              />
            </div>

            <!-- Date Range -->
            <div class="form-field">
              <app-date-picker
                [control]="getFormControl(tournamentForm, 'startDate')"
                label="Start Date"
                [datePickerParams]="startDateParams"
              />
            </div>
            <div class="form-field">
              <app-date-picker
                [control]="getFormControl(tournamentForm, 'endDate')"
                label="End Date"
                [datePickerParams]="endDateParams"
              />
            </div>

            <!-- Age Groups -->
            <div class="form-field">
              <app-multi-select
                [control]="getFormControl(tournamentForm, 'age')"
                label="Age Groups"
                [options]="ageOptions"
                errorMessage="Please select at least one age group"
              />
            </div>

            <!-- Skill Levels -->
            <div class="form-field">
              <app-multi-select
                [control]="getFormControl(tournamentForm, 'level')"
                label="Skill Levels"
                [options]="levelOptions"
                errorMessage="Please select at least one level"
              />
            </div>

            <!-- Rink/Venue -->
            <div class="form-field-full">
              <app-input
                [control]="getFormControl(tournamentForm, 'rink')"
                label="Primary Rink/Venue"
              />
            </div>

            <!-- Registration URL -->
            <div class="form-field-full">
              <app-input
                [control]="getFormControl(tournamentForm, 'registrationUrl')"
                label="Registration URL"
              />
            </div>

            <!-- Description -->
            <div class="form-field-full">
              <app-text-area
                [control]="getFormControl(tournamentForm, 'description')"
                label="Description"
              />
            </div>
          </div>
        </form>
      </ng-template>
      <ng-template #footer>
        <div class="form-actions">
          <p-button
            type="button"
            label="Submit Free Listing"
            severity="secondary"
            [disabled]="tournamentForm.invalid || loadingService.isLoading()"
            [loading]="loadingService.isLoading()"
            (click)="onSubmit()"
          />
          <p-button
            type="button"
            label="Get Featured ($99)"
            [disabled]="tournamentForm.invalid || loadingService.isLoading()"
            [loading]="loadingService.isLoading()"
            (click)="onShowPricing()"
          />
        </div>
      </ng-template>
    </app-card>
  `,
  styleUrls: ['./tournament-director-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDirectorFormComponent {
  protected loadingService = inject(LoadingService);

  // Output events to parent component
  @Output() formSubmit = new EventEmitter<CreateTournamentDto>();
  @Output() showPricing = new EventEmitter<CreateTournamentDto>();

  getFormControl = getFormControl;

  // Form definition
  tournamentForm = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
    location: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    startDate: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    endDate: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    age: new FormControl<string[]>([], {
      validators: [Validators.required],
    }),
    level: new FormControl<string[]>([], {
      validators: [Validators.required],
    }),
    rink: new FormControl(''),
    registrationUrl: new FormControl(''),
    description: new FormControl(''),
  });

  // Date picker configuration
  startDateParams = {
    showIcon: true,
    minDate: new Date(),
    maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    placeholder: 'Select start date',
    errorMessage: 'Start date is required',
  };

  endDateParams = {
    showIcon: true,
    minDate: new Date(),
    maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    placeholder: 'Select end date',
    errorMessage: 'End date is required',
  };

  // Age group options for multi-select
  ageOptions = {
    listItems: [
      { label: '6U', value: '6U' },
      { label: '8U', value: '8U' },
      { label: '10U', value: '10U' },
      { label: '12U', value: '12U' },
      { label: '14U', value: '14U' },
      { label: '16U', value: '16U' },
      { label: '18U', value: '18U' },
      { label: '19U', value: '19U' },
    ],
    itemLabel: 'label',
    placeholder: 'Select age groups',
    isAutoComplete: false,
    emptyMessage: 'No age groups available',
    errorMessage: 'Please select at least one age group',
    maxSelectedLabels: 3,
    fluid: true,
  };

  // Skill level options for multi-select
  levelOptions = {
    listItems: [
      { label: 'AAA', value: 'AAA' },
      { label: 'AA', value: 'AA' },
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
      { label: 'C', value: 'C' },
      { label: 'Rec', value: 'Rec' },
    ],
    itemLabel: 'label',
    placeholder: 'Select skill levels',
    isAutoComplete: false,
    emptyMessage: 'No levels available',
    errorMessage: 'Please select at least one level',
    maxSelectedLabels: 3,
    fluid: true,
  };

  /**
   * Submits the form for free listing.
   */
  onSubmit() {
    if (this.tournamentForm.valid) {
      this.formSubmit.emit(this.getFormData());
    } else {
      this.markFormTouched();
    }
  }

  /**
   * Shows pricing options for featured listing.
   */
  onShowPricing() {
    if (this.tournamentForm.valid) {
      this.showPricing.emit(this.getFormData());
    } else {
      this.markFormTouched();
    }
  }

  /**
   * Extracts and formats form data for submission.
   */
  private getFormData(): CreateTournamentDto {
    const values = this.tournamentForm.value;

    return {
      name: values.name || '',
      email: values.email || '',
      location: values.location || '',
      startDate: this.formatDate(values.startDate),
      endDate: this.formatDate(values.endDate),
      age: values.age?.map((a: any) => a.value || a) || [],
      level: values.level?.map((l: any) => l.value || l) || [],
      rink: values.rink || undefined,
      registrationUrl: values.registrationUrl || undefined,
      description: values.description || undefined,
      featured: false,
    };
  }

  /**
   * Formats a Date object to ISO date string (YYYY-MM-DD).
   */
  private formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  /**
   * Marks all form controls as touched to show validation errors.
   */
  private markFormTouched() {
    Object.keys(this.tournamentForm.controls).forEach((key) => {
      const control = this.tournamentForm.get(key);
      control?.markAsTouched();
    });
  }
}
