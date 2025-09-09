import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingService } from '../../shared/services/loading.service';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../shared/components/card/card.component';
import { SliderComponent } from '../../shared/components/slider/slider.component';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox.component';

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
      <div class="opponents-container">
        <app-card class="card">
          <ng-template #title>Find Opponents </ng-template>
          <ng-template #content>
            <div class="content">
              <div class="content-div">
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
                  </div>
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
              </div>
              <div class="content-div">
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
                  <app-checkbox
                    [parentForm]="opponentsForm"
                    fcName="girlsOnly"
                  />
                  <p-iftalabel for="girlsOnly">Girls Only</p-iftalabel>
                </div>
              </div>
              <div class="content-div">
                <p-button
                  label="Start Search"
                  type="submit"
                  icon="pi pi-sparkles"
                  iconPos="right"
                />
              </div>
            </div>
          </ng-template>
        </app-card>
      </div>
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
