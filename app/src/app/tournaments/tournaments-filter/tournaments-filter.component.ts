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
import { SliderComponent } from '../../shared/components/slider/slider.component';
import { LoadingService } from '../../shared/services/loading.service';
import { SelectComponent } from '../../shared/components/select/select.component';

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
    SelectComponent
  ],
  providers: [LoadingService],
  template: `
    <form [formGroup]="tournamentsForm" (ngSubmit)="submit()">
      <app-card class="card">
        <ng-template #title>Find Tournaments</ng-template>
        <ng-template #content>
          <div class="content">
            <div>
              <p-iftalabel for="distance"
                >Maximum Travel Distance (mi):
                <strong>{{ tournamentsForm.get('distance')?.value }}</strong>
                <app-slider
                  [parentForm]="tournamentsForm"
                  fcName="distance"
                  [isRange]="false"
                  [step]="5"
                  [min]="0"
                  [max]="300"
              /></p-iftalabel>
            </div>

            <div>
              <app-select
                [parentForm]="tournamentsForm"
                fcName="level"
                [options]="levels"
              />
            </div>

            <div class="checkbox">
              <app-checkbox [parentForm]="tournamentsForm" fcName="girlsOnly" />
              <p-iftalabel for="girlsOnly">Girls Only</p-iftalabel>
            </div>
          </div>
          <div class="submit-button">
            <p-button
              label="Start Search"
              type="submit"
              icon="pi pi-sparkles"
              iconPos="right"
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
  tournamentsForm: FormGroup = new FormGroup({
    distance: new FormControl(10, {
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
