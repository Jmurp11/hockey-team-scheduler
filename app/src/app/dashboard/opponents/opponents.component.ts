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

@Component({
  selector: 'app-opponents',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxComponent,
    CardComponent,
    ReactiveFormsModule,
    SliderComponent,
    ButtonModule,
    IftaLabelModule,
  ],
  providers: [LoadingService],
  template: `
    <form [formGroup]="opponentsForm" (ngSubmit)="submit()">
      <app-card class="card">
        <ng-template #title>Find Opponents</ng-template>
        <ng-template #content>
          <div class="content">
            <div>
              <p-iftalabel for="distance"
                >Maximum Travel Distance (mi):
                <strong>{{ opponentsForm.get('distance')?.value }}</strong>
                <app-slider
                  [parentForm]="opponentsForm"
                  fcName="distance"
                  [isRange]="false"
                  [step]="5"
                  [min]="0"
                  [max]="300"
              /></p-iftalabel>
            </div>

            <div>
              <p-iftalabel for="rating"
                >Rating
                <app-slider
                  [parentForm]="opponentsForm"
                  fcName="rating"
                  [isRange]="true"
                  [min]="60"
                  [max]="100"
                />
              </p-iftalabel>
              <div class="distance-slider">
                <p-iftalabel for="rating"
                  >Min:
                  <strong>{{
                    opponentsForm.get('rating')?.value[0]
                  }}</strong></p-iftalabel
                >
                <p-iftalabel for="rating"
                  >Max:
                  <strong>{{
                    opponentsForm.get('rating')?.value[1]
                  }}</strong></p-iftalabel
                >
              </div>
            </div>

            <div class="checkbox">
              <app-checkbox
                [parentForm]="opponentsForm"
                fcName="excludeLeague"
              />
              <p-iftalabel for="excludeLeague"
                >Exclude League Members</p-iftalabel
              >
            </div>
            <div class="checkbox">
              <app-checkbox [parentForm]="opponentsForm" fcName="girlsOnly" />
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
  styleUrls: ['./opponents.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsComponent {
  @Output() selectedInputs = new EventEmitter<any>();
  protected loadingService = inject(LoadingService);

  opponentsForm: FormGroup = new FormGroup({
    distance: new FormControl(10, {
      validators: [Validators.required],
    }),
    rating: new FormControl([60, 100], {
      validators: [Validators.required],
    }),
    excludeLeague: new FormControl(false),
    girlsOnly: new FormControl(false),
  });

  submit() {
    this.selectedInputs.emit(this.opponentsForm.value);
  }
}
