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
} from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import {
  Game,
  GAME_TYPE_OPTIONS,
  getFormControl,
  initAddGameForm,
  IS_HOME_OPTIONS,
  transformAddGameFormData,
  updateGameTimeConflictValidator,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable, take } from 'rxjs';
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
      const currentEditMode = this.editModeSignal();

      // Skip if form isn't initialized yet
      if (!this.addGameForm) {
        return;
      }

      // Reinitialize form when gameData changes
      this.addGameForm = initAddGameForm(currentGameData);

      // Update validator with current game ID when games cache is available
      const games = this.scheduleService.gamesCache.value;
      if (games) {
        updateGameTimeConflictValidator(
          this.addGameForm,
          games,
          currentGameData?.id,
        );
      }
    });
  }

  ngOnInit(): void {
    // Initialize signals with current values
    this.editModeSignal.set(this.editMode);
    this.gameDataSignal.set(this.gameData);

    // Initialize form
    this.addGameForm = initAddGameForm(this.gameData);

    this.items$ = this.teamsService.teams({
      age: this.currentUser.age,
    });

    this.items$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      this.formFieldsData = getFormFields(items);
    });

    this.gamesCache$();
  }

  gamesCache$() {
    return this.scheduleService.gamesCache
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((games) => {
        if (games && this.addGameForm) {
          updateGameTimeConflictValidator(
            this.addGameForm,
            games,
            this.gameDataSignal()?.id,
          );
        }
      });
  }

  initGameForm() {
    return initAddGameForm(this.gameData);
  }

  handleGameTimeConflictError() {
    const dateControl = this.addGameForm.get('date');
    if (dateControl?.errors?.['gameTimeConflict']) {
      const conflictError = dateControl.errors['gameTimeConflict'];
      this.toastService.presentToast({
        severity: 'error',
        summary: 'Schedule Conflict',
        detail: conflictError.message,
      });
    }
  }

  submit() {
    // Check for validation errors including time conflicts
    if (!this.addGameForm.valid) {
      this.handleGameTimeConflictError();
      return;
    }

    const input = transformAddGameFormData(
      this.addGameForm.value,
      this.currentUser.user_id,
    );

    // Optimistic update - update cache immediately
    this.editMode && this.gameData
      ? this.scheduleService.optimisticUpdateGame({
          id: this.gameData.id,
          ...input[0],
        })
      : this.scheduleService.optimisticAddGames(input);

    const operation$ = this.chooseOperation(input);

    operation$
      .pipe(take(1))
      .subscribe((response: any) => this.handleSubscription(response));
  }

  cancel() {
    this.addGameForm.reset();
    this.addGameDialogService.closeDialog();
  }

  chooseOperation(input: any): Observable<any> {
    return this.editMode && this.gameData
      ? (
          this.addGameService.updateGame({
            id: this.gameData.id,
            ...input[0],
          }) as Observable<Partial<Game>>
        ).pipe(
          take(1),
          tap((response: Partial<Game>) =>
            this.scheduleService.syncGameIds([response], true),
          ),
        )
      : (
          this.addGameService.addGame(input) as Observable<Partial<Game>[]>
        ).pipe(
          take(1),
          tap((response: Partial<Game>[]) =>
            this.scheduleService.syncGameIds(response),
          ),
        );
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
}
