import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable } from 'rxjs/internal/Observable';
import { AuthService } from '../../auth/auth.service';
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
import { Game } from '../../shared/types/game.type';

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
    ProgressSpinnerModule,
  ],
  providers: [LoadingService, TeamsService],
  template: `
    @if (items$ | async; as items) {
    <form [formGroup]="addGameForm">
      <app-dialog [visible]="addGameService.isVisible()">
        <ng-template #header>
          <div class="dialog-header">
            <span
              ><h2>{{ title() }}</h2></span
            >
          </div>
        </ng-template>
        @if (formFieldsData.length > 0) {
        <div class="section">
          @for (field of formFieldsData; track field.controlName) { @switch
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
            [control]="getFormControl(addGameForm, 'game_type')"
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
        }
        <ng-template #footer>
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="cancel()"
          />
          <p-button label="Submit" (click)="submit()"></p-button>
        </ng-template>
      </app-dialog>
    </form>
    } @else {
    <div class="loading-spinner">
      <p-progressSpinner />
    </div>
    }
  `,
  styleUrls: ['./add-game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddGameComponent implements OnInit {
  @Input() gameData: Game | null = null;
  @Input() editMode: boolean = false;

  protected loadingService = inject(LoadingService);
  protected destroyRef = inject(DestroyRef);

  private authService = inject(AuthService);

  addGameService = inject(AddGameService);
  teamsService = inject(TeamsService);

  private editModeSignal = signal(false);
  title = computed(() => (this.editModeSignal() ? 'Update Game' : 'Add Game'));

  gameTypeOptions = [
    { label: 'League', value: 'league' },
    { label: 'Playoff', value: 'playoff' },
    { label: 'Tournament', value: 'tournament' },
    { label: 'Exhibition', value: 'exhibition' },
  ];

  items$: Observable<any>;
  formFieldsData: any[] = [];

  isHomeOptions = [
    { label: 'Home', value: 'home' },
    { label: 'Away', value: 'away' },
  ];

  getFormControl = getFormControl;

  formFields = getFormFields;

  currentUser = this.authService.currentUser();

  addGameForm: FormGroup;

  ngOnInit(): void {
    console.log({gameData: this.gameData})
    this.addGameForm = this.initGameForm();
    this.editModeSignal.set(this.editMode);

    this.items$ = this.teamsService.teams({
      age: this.currentUser.age,
    });

    this.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => (this.formFieldsData = getFormFields(items)));
  }

  initGameForm() {
    return new FormGroup({
      opponent: new FormControl(this.gameData?.opponent || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      rink: new FormControl(this.gameData?.rink || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      city: new FormControl(this.gameData?.city || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      state: new FormControl(this.gameData?.state || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      country: new FormControl(this.gameData?.country || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      date: new FormControl(this.gameData?.date || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      game_type: new FormControl(this.gameData?.game_type || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      isHome: new FormControl(this.gameData?.isHome || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
    });
  }

  submit() {
    const dateValue = this.addGameForm.value.date;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

    const input = [
      {
        ...this.addGameForm.value,
        country: this.addGameForm.value.country.value,
        state: this.addGameForm.value.state.value,
        opponent: this.addGameForm.value.opponent.value.id,
        isHome: this.addGameForm.value.isHome === 'home',
        user: this.currentUser.user_id,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        time: date.toTimeString().split(' ')[0],
      },
    ];

    const operation$ = this.editMode
      ? this.addGameService.updateGame({ id: this.gameData!.id, ...input[0] })
      : this.addGameService.addGame(input);

    operation$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.addGameService.closeDialog());
  }

  cancel() {
    this.addGameForm.reset();
    this.addGameService.closeDialog();
  }
}
