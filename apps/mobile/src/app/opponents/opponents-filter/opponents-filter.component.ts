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
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { getFormControl, OpponentSearchParams } from '@hockey-team-scheduler/shared-utilities';
import { IonLabel, IonList, IonSelectOption } from '@ionic/angular/standalone';
import { SelectItem } from 'primeng/api';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { CheckboxComponent } from '../../shared/checkbox/checkbox.component';
import { ItemComponent } from '../../shared/item/item.component';
import { RangeComponent } from '../../shared/range/range.component';
import { SelectComponent } from '../../shared/select/select.component';

@Component({
  selector: 'app-opponents-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonLabel,
    IonList,
    IonSelectOption,
    CheckboxComponent,
    RangeComponent,
    ButtonComponent,
    SelectComponent,
    ItemComponent,
  ],
  template: `
    <form [formGroup]="opponentsForm" (ngSubmit)="submit()">
      <ion-list>
        <!-- <app-item [lines]="'none'">
          <app-checkbox
            slot="start"
            [color]="'secondary'"
            [value]="opponentsForm.get('changeAssociation')?.value"
            (ionChange)="onChangeAssociationToggle($event)"
          />
          <ion-label>Change Association</ion-label>
        </app-item> -->

        @if (opponentsForm.get('changeAssociation')?.value) {
          <app-item [lines]="'none'">
            <app-select
              [label]="'Association'"
              [labelPlacement]="'stacked'"
              [fill]="'outline'"
              [interface]="'action-sheet'"
              [value]="opponentsForm.get('association')?.value?.value"
              (ionChangeEvent)="onAssociationChange($event)"
            >
              @for (assoc of associations$ | async; track assoc.value) {
                <ion-select-option [value]="assoc.value">{{
                  assoc.label
                }}</ion-select-option>
              }
            </app-select>
          </app-item>
        }

        <app-item [lines]="'none'">
          <div class="range-container">
            <ion-label>
              Maximum Travel Distance:
              <strong>{{ opponentsForm.get('distance')?.value }} mi</strong>
            </ion-label>
            <app-range
              [min]="0"
              [max]="300"
              [step]="5"
              [pin]="true"
              [color]="'secondary'"
              [value]="opponentsForm.get('distance')?.value"
              (ionChange)="onDistanceChange($event)"
            />
          </div>
        </app-item>

        <app-item [lines]="'none'">
          <div class="range-container">
            <ion-label>
              Rating Range:
              <strong
                >{{ opponentsForm.get('rating')?.value[0] }} -
                {{ opponentsForm.get('rating')?.value[1] }}</strong
              >
            </ion-label>
            <app-range
              [min]="60"
              [max]="100"
              [dualKnobs]="true"
              [pin]="true"
              [color]="'secondary'"
              [value]="{
                lower: opponentsForm.get('rating')?.value[0],
                upper: opponentsForm.get('rating')?.value[1],
              }"
              (ionChange)="onRatingChange($event)"
            />
          </div>
        </app-item>

        <app-item [lines]="'none'">
          <app-checkbox
            slot="start"
            [color]="'secondary'"
            [value]="opponentsForm.get('girlsOnly')?.value"
            (ionChange)="onGirlsOnlyToggle($event)"
          />
          <ion-label>Girls Only</ion-label>
        </app-item>
      </ion-list>

      <div class="submit-button">
        <app-button [expand]="'block'" [type]="'submit'" [color]="'secondary'">
          Start Search
        </app-button>
      </div>
    </form>
  `,
  styles: [
    `
      .range-container {
        width: 100%;
        padding: .1rem 0;
      }

      ion-label {
        display: block;
        margin-bottom: 0.1rem;
      }

      .submit-button {
        padding: 1rem;
      }

      app-item {
        --padding-start: 0;
        --inner-padding-end: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsFilterComponent implements OnInit {
  @Input() associations$!: Observable<SelectItem[]>;
  @Input() userDefault$!: Observable<SelectItem>;
  @Output() selectedInputs = new EventEmitter<OpponentSearchParams>();

  protected loadingService = inject(LoadingService);
  protected destroyRef = inject(DestroyRef);

  getFormControl = getFormControl;

  opponentsForm!: FormGroup;

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
  }

  submit() {
    this.selectedInputs.emit(this.opponentsForm.value);
  }

  initializeForm() {
    return new FormGroup({
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

  onChangeAssociationToggle(event: CustomEvent) {
    this.opponentsForm.get('changeAssociation')?.setValue(event.detail.checked);
  }

  onGirlsOnlyToggle(event: CustomEvent) {
    this.opponentsForm.get('girlsOnly')?.setValue(event.detail.checked);
  }

  onAssociationChange(event: CustomEvent) {
    const value = event.detail.value;
    const selectedAssoc = this.associations$.pipe(
      map((assocs: SelectItem[]) => assocs.find((a) => a.value === value)),
    );
    selectedAssoc.subscribe((assoc) => {
      this.opponentsForm.get('association')?.setValue(assoc);
    });
  }

  onDistanceChange(event: CustomEvent) {
    this.opponentsForm.get('distance')?.setValue(event.detail.value);
  }

  onRatingChange(event: CustomEvent) {
    const value = event.detail.value;
    this.opponentsForm.get('rating')?.setValue([value.lower, value.upper]);
  }
}
