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
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CardComponent } from '../../shared/components/card/card.component';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { SliderComponent } from '../../shared/components/slider/slider.component';
import { LoadingService } from '../../shared/services/loading.service';
import { SelectParams } from '../../shared/types/form-item.type';
import { getFormControl } from '../../shared/utilities/form.utility';

@Component({
  selector: 'app-tournaments-filter',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxComponent,
    CardComponent,
    ReactiveFormsModule,
    SliderComponent,
    ButtonModule,
    IftaLabelModule,
    SelectComponent,
  ],
  providers: [LoadingService],
  template: `
    <form [formGroup]="tournamentsForm" (ngSubmit)="submit()">
      <app-card class="card">
        <ng-template #title>Find Tournaments</ng-template>
        <ng-template #content>
          <div class="card__content">
            <div class="checkbox">
              <app-checkbox
                [control]="getFormControl(tournamentsForm, 'girlsOnly')"
              />
              <p-iftalabel for="girlsOnly">Girls Only</p-iftalabel>
            </div>
            <div>
              <app-select
                [control]="getFormControl(tournamentsForm, 'age')"
                [options]="ageOptions"
                label="Age"
              />
            </div>
            <div>
              <app-select
                [control]="getFormControl(tournamentsForm, 'level')"
                [options]="levelOptions"
                label="Level"
              />
            </div>

            <div class="slider-container">
              <p-iftalabel for="distance"
                >Maximum Travel Distance (mi):
                <strong>{{ tournamentsForm.get('distance')?.value }}</strong>
                <app-slider
                  [control]="getFormControl(tournamentsForm, 'distance')"
                  [isRange]="false"
                  [step]="5"
                  [min]="0"
                  [max]="500"
              /></p-iftalabel>
            </div>
          </div>
          <div class="submit-button">
            <p-button
              label="Start Search"
              type="submit"
            />
          </div>
        </ng-template>
      </app-card>
    </form>
  `,
  styleUrls: ['./tournaments-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsFilterComponent {
  @Output() selectedInputs = new EventEmitter<any>();
  protected loadingService = inject(LoadingService);

  levels = [
    { label: 'AAA', value: 'AAA' },
    { label: 'AA', value: 'AA' },
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
  ];

  levelOptions: SelectParams<{ label: string; value: string }> = {
    itemLabel: 'label',
    listItems: this.levels,
    isAutoComplete: false,
    emptyMessage: 'No levels found',
    errorMessage: 'ERROR',
  };

  ages = [
    { label: '19u', value: '19u' },
    { label: '18u', value: '18u' },
    { label: '16u', value: '16u' },
    { label: '15u', value: '15u' },
    { label: '14u', value: '14u' },
    { label: '13u', value: '13u' },
    { label: '12u', value: '12u' },
    { label: '11u', value: '11u' },
    { label: '10u', value: '10u' },
    { label: '9u', value: '9u' },
  ];

  ageOptions: SelectParams<{ label: string; value: string }> = {
    itemLabel: 'label',
    listItems: this.ages,
    isAutoComplete: false,
    emptyMessage: 'No ages found',
    showClear: true,
    errorMessage: 'ERROR',
  };

  getFormControl = getFormControl;

  tournamentsForm: FormGroup = new FormGroup({
    distance: new FormControl(10, {
      validators: [Validators.required],
    }),
    age: new FormControl(null, {
      validators: [Validators.required],
    }),
    level: new FormControl(null, {
      validators: [Validators.required],
    }),
    girlsOnly: new FormControl(false),
  });

  submit() {
    this.selectedInputs.emit(this.tournamentsForm.value);
  }
}
