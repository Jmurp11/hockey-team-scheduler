import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AddGameService,
  AuthService,
  ScheduleService,
  TeamsService,
  RinksService,
} from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import {
  Game,
  GAME_TYPE_OPTIONS,
  getFormControl,
  initAddGameForm,
  IS_HOME_OPTIONS,
  SelectOption,
  transformAddGameFormData,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { combineLatest, Observable, take } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SelectComponent } from '../../shared';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectButtonComponent } from '../../shared/components/select-button/select-button.component';
import { AddGameDialogService } from './add-game-dialog.service';
import { getFormFields } from './add-game.constants';
import { ToastService } from '../../shared/services/toast.service';
import { SelectItem } from 'primeng/api';

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
  providers: [],
  template: `
    @if (items$ | async; as items) {
      <form [formGroup]="addGameForm">
        <app-dialog [visible]="addGameDialogService.isVisible()">
          <ng-template #header>
            <div class="dialog-header">
              <span
                ><h2>{{ title() }}</h2></span
              >
            </div>
          </ng-template>
          @if (formFieldsData.length > 0) {
            <div class="section">
              @for (field of formFieldsData; track field.controlName) {
                @switch (field.controlType) {
                  @case ('input') {
                    <app-input
                      class="section__item"
                      [control]="getFormControl(addGameForm, field.controlName)"
                      [label]="field.labelName"
                    />
                  }
                  @case ('select') {
                    <app-select
                      class="section__item"
                      [control]="getFormControl(addGameForm, field.controlName)"
                      [label]="field.labelName"
                      [options]="field.options"
                    />
                  }
                  @case ('autocomplete') {
                    <app-auto-complete
                      class="section__item"
                      [control]="getFormControl(addGameForm, field.controlName)"
                      [label]="field.labelName"
                      [items]="field.items || []"
                      [optionLabel]="field.optionLabel"
                      [optionValue]="field.optionValue"
                      [allowAddNew]="field.allowAddNew || false"
                      [isRink]="field.isRink || false"
                    />
                  }
                  @case ('date-picker') {
                    <app-date-picker
                      class="section__item"
                      [control]="getFormControl(addGameForm, field.controlName)"
                      [label]="field.labelName"
                      [datePickerParams]="field.dpOptions"
                    />
                  }
                }
              }
              <app-select-button
                [control]="getFormControl(addGameForm, 'game_type')"
                label="Game Type"
                [options]="gameTypeOptions"
              />
              <div></div>
              <app-select-button
                [control]="getFormControl(addGameForm, 'isHome')"
                label="Is Home"
                [options]="isHomeOptions"
              />
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
  @Input() set gameData(value: Game | null) {
    this._gameData = value;
    this.gameDataSignal.set(value);
  }
  get gameData(): Game | null {
    return this._gameData;
  }
  private _gameData: Game | null = null;

  @Input() set editMode(value: boolean) {
    this._editMode = value;
    this.editModeSignal.set(value);
  }
  get editMode(): boolean {
    return this._editMode;
  }
  private _editMode = false;

  protected loadingService = inject(LoadingService);
  protected destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private toastService = inject(ToastService);
  private addGameService = inject(AddGameService);

  addGameDialogService = inject(AddGameDialogService);
  teamsService = inject(TeamsService);
  rinksService = inject(RinksService);

  private editModeSignal = signal(false);
  private gameDataSignal = signal<Game | null>(null);

  title = computed(() => (this.editModeSignal() ? 'Update Game' : 'Add Game'));

  gameTypeOptions = GAME_TYPE_OPTIONS;

  items$: Observable<any>;
  formFieldsData: any[] = [];

  isHomeOptions = IS_HOME_OPTIONS;

  getFormControl = getFormControl;

  formFields = getFormFields;

  currentUser = this.authService.currentUser();

  addGameForm: FormGroup;

  constructor() {
    // Effect to watch for changes in gameData or editMode and update validator
    effect(() => {
      const currentGameData = this.gameDataSignal();

      // Skip if form isn't initialized yet
      if (!this.addGameForm) {
        return;
      }

      console.log({ currentGameData });
      // Reinitialize form when gameData changes
      this.addGameForm = initAddGameForm(currentGameData);

      // Update validator with current game ID when games cache is available
      const games = this.scheduleService.gamesCache.value;

      // Re-subscribe to rink value changes after form is re-initialized
      this.subscribeToRinkValueChanges();
    });
  }

  private rinkValueChangesSub?: any;

  private subscribeToRinkValueChanges() {
    // Unsubscribe previous if exists
    if (this.rinkValueChangesSub) {
      this.rinkValueChangesSub.unsubscribe();
    }
    const obs = this.rinkValueChanges();
    if (obs) {
      this.rinkValueChangesSub = obs
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rink: SelectOption<Partial<Game> | string>) =>
          this.handleRinkValueChange(rink),
        );
    }
  }

  ngOnInit(): void {
    // Initialize signals with current values
    this.editModeSignal.set(this.editMode);
    this.gameDataSignal.set(this.gameData);

    // Initialize form
    this.addGameForm = initAddGameForm(this.gameData);

    this.items$ = combineLatest({
      teams: this.teamsService.teams({
        age: this.currentUser?.age,
      }),
      rinks: this.rinksService.getRinks(),
    });
    this.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ teams, rinks }) => {
        this.formFieldsData = getFormFields(teams, rinks);
      });

    this.subscribeToRinkValueChanges();
  }

  initGameForm() {
    return initAddGameForm(this.gameData);
  }

  submit() {
    const input = transformAddGameFormData(
      this.addGameForm.getRawValue(),
      this.currentUser?.user_id || null,
    );

    const operation$ = this.chooseOperation(input);

    operation$
      .pipe(take(1))
      .subscribe((response: any) => this.handleSubscription(response));
  }

  cancel() {
    this.addGameForm.reset();
    this.addGameDialogService.closeDialog();
  }

  updateGame$(input: any) {
    this.scheduleService.setDeleteRecord(this.gameData?.id || null);
    return (
      this.addGameService.updateGame({
        id: this.gameData?.id,
        ...input[0],
      }) as Observable<Partial<Game>>
    ).pipe(take(1));
  }

  addGame$(input: any) {
    return (
      this.addGameService.addGame(input) as Observable<Partial<Game>[]>
    ).pipe(take(1));
  }

  chooseOperation(input: any): Observable<any> {
    return this.editMode && this.gameData
      ? this.updateGame$(input)
      : this.addGame$(input);
  }

  handleSubscription(response: any) {
    this.addGameDialogService.closeDialog();

    if (
      response &&
      (response.hasOwnProperty('opponent') ||
        (Array.isArray(response) && response[0].hasOwnProperty('opponent')))
    ) {
      this.toastService.presentToast({
        severity: 'success',
        summary: this.editMode ? 'Game Updated' : 'Game Added',
        detail: this.editMode
          ? 'The game has been successfully updated.'
          : 'The game has been successfully added.',
      });
    } else {
      this.toastService.presentToast({
        severity: 'error',
        summary: this.editMode ? 'Update Failed' : 'Add Failed',
        detail: this.editMode
          ? 'There was an error updating the game. Please try again.'
          : 'There was an error adding the game. Please try again.',
      });
    }
  }

  rinkValueChanges() {
    return this.addGameForm.get('rink')?.valueChanges;
  }

  handleRinkValueChange(value: SelectOption<Partial<Game> | string> | null) {
    if (!value || (value && typeof value.value === 'string')) {
      this.addGameForm.get('city')?.setValue(null);
      this.addGameForm.get('state')?.setValue(null);
      this.addGameForm.get('country')?.setValue(null);
      this.addGameForm.get('city')?.enable();
      this.addGameForm.get('state')?.enable();
      this.addGameForm.get('country')?.enable();

      return;
    }

    if (typeof value.value === 'object') {
      this.addGameForm.get('city')?.setValue(value.value.city);
      this.addGameForm
        .get('state')
        ?.setValue({ label: value.value.state, value: value.value.state });
      this.addGameForm
        .get('country')
        ?.setValue({ label: value.value.country, value: value.value.country });
      this.addGameForm.get('city')?.disable();
      this.addGameForm.get('state')?.disable();
      this.addGameForm.get('country')?.disable();
    }
  }
}
