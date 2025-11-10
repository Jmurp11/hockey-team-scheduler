import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { SelectComponent, TeamsService } from '../../shared';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectButtonComponent } from '../../shared/components/select-button/select-button.component';
import { LoadingService } from '../../shared/services/loading.service';
import { getFormControl } from '../../shared/utilities/form.utility';
import { getFormFields } from './add-game.constants';
import { AddGameService } from './add-game.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs/internal/Observable';

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
  protected destroyRef = inject(DestroyRef);

  addGameService = inject(AddGameService);
  teamsService = inject(TeamsService);
  
  gameTypeOptions = [
    { label: 'League', value: 'league' },
    { label: 'Playoff', value: 'playoff' },
    { label: 'Tournament', value: 'tournament' },
    { label: 'Exhibition', value: 'exhibition' },
  ];

  items$: Observable<any[]>;

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

  ngOnInit(): void {
    // TODO: update endpoint to accept parameter for age group
    this.items$ = this.teamsService.getTeams(1);
  }

  submit() {
    this.addGameService
      .addGame(this.addGameForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.addGameService.closeDialog());
  }
}
