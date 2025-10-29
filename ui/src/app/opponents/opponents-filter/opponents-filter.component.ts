import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { combineLatest, Observable, startWith } from 'rxjs';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { SliderComponent } from '../../shared/components/slider/slider.component';
import { LoadingService } from '../../shared/services/loading.service';
import { SelectParams } from '../../shared/types/form-item.type';
import { getFormControl } from '../../shared/utilities/form.utility';

@Component({
  selector: 'app-opponents',
  standalone: true,
  imports: [
    AutoCompleteComponent,
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
    <form [formGroup]="opponentsForm" (ngSubmit)="submit()">
      <app-card class="card">
        <ng-template #title>Find Opponents</ng-template>
        <ng-template #content>
          <div class="card__content">
            <div class="checkbox-container">
              <div class="checkbox">
                <app-checkbox
                  [control]="getFormControl(opponentsForm, 'changeAssociation')"
                />
                <p-iftalabel for="changeAssociation"
                  >Change Association</p-iftalabel
                >
              </div>
              <div class="checkbox">
                <app-checkbox
                  [control]="getFormControl(opponentsForm, 'girlsOnly')"
                />
                <p-iftalabel for="girlsOnly">Girls Only</p-iftalabel>
              </div>
            </div>
            @if (opponentsForm.get('changeAssociation')?.value) {
            <div>
              <app-auto-complete
                [control]="getFormControl(opponentsForm, 'association')"
                label="Association"
                [items]="(associations$ | async) || []"
              />
            </div>
            }
            <div>
              <app-select
                [control]="getFormControl(opponentsForm, 'age')"
                [options]="ageOptions"
                label="Age"
              />
            </div>
            <div class="slider-container">
              <p-iftalabel for="distance"
                >Maximum Travel Distance (mi):
                <strong>{{ opponentsForm.get('distance')?.value }}</strong>
                <app-slider
                  [control]="getFormControl(opponentsForm, 'distance')"
                  [isRange]="false"
                  [step]="5"
                  [min]="0"
                  [max]="300"
              /></p-iftalabel>
            </div>

            <div class="slider-container">
              <p-iftalabel for="rating"
                >Rating
                <app-slider
                  [control]="getFormControl(opponentsForm, 'rating')"
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
          </div>
          <div class="submit-button">
            <p-button label="Start Search" type="submit" />
          </div>
        </ng-template>
      </app-card>
    </form>
  `,
  styleUrls: ['./opponents-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsFilterComponent implements OnInit {
  @Input() associations$: Observable<SelectItem[]>;

  @Input() userDefault$: Observable<SelectItem>;

  @Output() selectedInputs = new EventEmitter<any>();

  protected loadingService = inject(LoadingService);
  protected destroyRef = inject(DestroyRef);

  getFormControl = getFormControl;

  opponentsForm: FormGroup;

  ages = [
    { label: '19u', value: '19u' },
    { label: '18u', value: '18u' },
    { label: '16u', value: '16u' },
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
    placeholder: '',
    isAutoComplete: false,
    emptyMessage: 'No ages found',
    errorMessage: 'ERROR',
    showClear: true,
  };

  ngOnInit(): void {
    this.opponentsForm = this.initializeForm();

    combineLatest({
      changeAssociation: this.onChangeAssociation(),
      userDefault: this.userDefault$,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ changeAssociation, userDefault }: any) => {
        if (!changeAssociation) {
          this.opponentsForm.get('association')?.setValue(userDefault || null);
        }
      });

    this.opponentsForm
      .get('age')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        switch (value?.value || value) {
          case '19u':
            this.opponentsForm.get('girlsOnly')?.setValue(true);
            break;
          case '13u':
            this.opponentsForm.get('girlsOnly')?.setValue(false);
            this.opponentsForm.get('girlsOnly')?.disable();
            break;
          case '11u':
            this.opponentsForm.get('girlsOnly')?.setValue(false);
            this.opponentsForm.get('girlsOnly')?.disable();
            break;
          case '9u':
            this.opponentsForm.get('girlsOnly')?.setValue(false);
            this.opponentsForm.get('girlsOnly')?.disable();
            break;
          default:
            this.opponentsForm.get('girlsOnly')?.enable();
        }
      });
  }

  submit() {
    this.selectedInputs.emit(this.opponentsForm.value);
  }

  initializeForm() {
    return new FormGroup({
      age: new FormControl(
        { label: '14u', value: '14u' },
        {
          validators: [Validators.required],
        }
      ),
      association: new FormControl(null, {
        validators: [Validators.required],
      }),
      distance: new FormControl(10, {
        validators: [Validators.required],
      }),
      rating: new FormControl([60, 100], {
        validators: [Validators.required],
      }),
      girlsOnly: new FormControl(false),
      changeAssociation: new FormControl(false),
    });
  }

  onChangeAssociation() {
    return (
      this.opponentsForm
        .get('changeAssociation')
        ?.valueChanges.pipe(startWith(false)) ||
      new Observable((observer) => observer.next(false))
    );
  }
}
