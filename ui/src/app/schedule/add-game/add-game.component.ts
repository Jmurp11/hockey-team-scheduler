import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectComponent } from '../../shared';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectButtonComponent } from '../../shared/components/select-button/select-button.component';
import { LoadingService } from '../../shared/services/loading.service';
import { getFormControl } from '../../shared/utilities/form.utility';
import { getFormFields } from './add-game.constants';
import { AddGameService } from './add-game.service';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteComponent,
    SelectComponent,
    DatePickerComponent,
    InputComponent,
    DialogComponent,
    ButtonModule,
    SelectButtonComponent,
  ],
  providers: [LoadingService],
  template: `
    <form [formGroup]="addGameForm">
      <app-dialog [visible]="addGameService.isVisible()">
        <ng-template #header>
          <div class="dialog-header">
            <span><h2>Add Game</h2></span>
            <span
              ><p-button
                icon="pi pi-times"
                [rounded]="true"
                [text]="true"
                (click)="addGameService.closeDialog()"
              />
            </span>
          </div>
        </ng-template>
        <div class="section">
          @for (field of formFields(items); track field.controlName) { @switch
          (field.controlType) { @case ('input') {
          <app-input
            class="section__item"
            [control]="getFormControl(addGameForm, field.controlName)"
            [label]="field.labelName"
          />
          } @case ('select') {
          <app-select
            class="section__item"
            [control]="getFormControl(addGameForm, field.controlName)"
            [label]="field.labelName"
            [options]="field.options"
          />
          } @case ('autocomplete') {
          <app-auto-complete
            class="section__item"
            [control]="getFormControl(addGameForm, field.controlName)"
            [label]="field.labelName"
            [items]="field.items || []"
          />
          } @case ('date-picker') {
          <app-date-picker
            class="section__item"
            [control]="getFormControl(addGameForm, field.controlName)"
            [label]="field.labelName"
            [datePickerParams]="field.dpOptions"
          />
          } } }
          <app-select-button
            [control]="getFormControl(addGameForm, 'gameType')"
            label="Game Type"
            [options]="gameTypeOptions"
          ></app-select-button>
          <div></div>
          <app-select-button
            [control]="getFormControl(addGameForm, 'isHome')"
            label="Is Home"
            [options]="isHomeOptions"
          ></app-select-button>
        </div>
        <ng-template #footer>
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="addGameService.closeDialog()"
          />
          <p-button label="Submit" (click)="submit()"></p-button>
        </ng-template>
      </app-dialog>
    </form>
  `,
  styleUrls: ['./add-game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddGameComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  addGameService = inject(AddGameService);

  gameTypeOptions = [
    { label: 'League', value: 'league' },
    { label: 'Playoff', value: 'playoff' },
    { label: 'Tournament', value: 'tournament' },
    { label: 'Exhibition', value: 'exhibition' },
  ];

  items = [
    [
      {
        idx: 0,
        id: 30782,
        created_at: '2025-10-22 22:30:20.088195+00',
        team_name: 'Portage Lake Flyers 14U AA',
        association: 4383,
        rating: 85.02,
        record: '0-4-1',
        agd: -1.8,
        sched: 86.82,
        age: '14u',
        girls_only: false,
        name: 'Copper Country Jr Hockey Association',
        city: 'Houghton',
        state: 'MI',
        country: 'USA',
      },
      {
        idx: 1,
        id: 31988,
        created_at: '2025-10-29 12:12:51.476679+00',
        team_name: 'Kensington Valley Renegades 9U A',
        association: 3152,
        rating: 77.3,
        record: '3-3-0',
        agd: 0.1,
        sched: 77.1,
        age: '9u',
        girls_only: false,
        name: 'Kensington Valley Hockey Association',
        city: 'Brighton',
        state: 'MI',
        country: 'USA',
      },
      {
        idx: 2,
        id: 32490,
        created_at: '2025-10-29 12:18:38.021307+00',
        team_name: 'Pittsburgh Arctic Foxes (#1) 10U AA',
        association: 4007,
        rating: 81.1,
        record: '1-10-0',
        agd: -2.7,
        sched: 83.8,
        age: '10u',
        girls_only: false,
        name: 'Arctic Foxes Hockey Association',
        city: 'Coraopolis',
        state: 'PA',
        country: 'USA',
      },
      {
        idx: 3,
        id: 32522,
        created_at: '2025-10-29 12:18:38.021307+00',
        team_name: 'Southern Illinois Ice Hawks 10U A3',
        association: 4466,
        rating: 80.4,
        record: '4-1-1',
        agd: 2.5,
        sched: 77.9,
        age: '10u',
        girls_only: false,
        name: 'Southern Illinois Ice Hawks Hockey Association',
        city: "O'Fallon",
        state: 'IL',
        country: 'USA',
      },
    ],
  ];

  isHomeOptions = [
    { label: 'Home', value: 'home' },
    { label: 'Away', value: 'away' },
  ];

  getFormControl = getFormControl;

  formFields = getFormFields;

  addGameForm: FormGroup = new FormGroup({
    opponent: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
    rink: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    city: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    state: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    country: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    date: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    gameType: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    isHome: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  ngOnInit() {
    console.log('addGameService', this.addGameService.isVisible());
  }
  submit() {
    console.log('submitted');
  }
}
