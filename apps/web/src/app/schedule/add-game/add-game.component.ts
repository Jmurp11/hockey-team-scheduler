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
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { take, tap } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { SelectComponent } from '../../shared';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectButtonComponent } from '../../shared/components/select-button/select-button.component';
import { AddGameDialogService } from './add-game-dialog.service';
import { getFormFields } from './add-game.constants';

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
    ToastModule,
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
  @Input() gameData: Game | null = null;
  @Input() editMode = false;

  protected loadingService = inject(LoadingService);
  protected destroyRef = inject(DestroyRef);

  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  addGameDialogService = inject(AddGameDialogService);
  private addGameService = inject(AddGameService);

  teamsService = inject(TeamsService);

  private editModeSignal = signal(false);
  title = computed(() => (this.editModeSignal() ? 'Update Game' : 'Add Game'));

  gameTypeOptions = GAME_TYPE_OPTIONS;

  items$: Observable<any>;
  formFieldsData: any[] = [];

  isHomeOptions = IS_HOME_OPTIONS;

  getFormControl = getFormControl;

  formFields = getFormFields;

  currentUser = this.authService.currentUser();

  addGameForm: FormGroup;

  ngOnInit(): void {
    this.addGameForm = initAddGameForm(this.gameData);

    this.editModeSignal.set(this.editMode);

    this.items$ = this.teamsService.teams({
      age: this.currentUser.age,
    });

    this.items$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      this.formFieldsData = getFormFields(items);
    });
  }

  initGameForm() {
    return initAddGameForm(this.gameData);
  }

  submit() {
    const input = transformAddGameFormData(
      this.addGameForm.value,
      this.currentUser.user_id,
    );

    // Optimistic update - update cache immediately
    if (this.editMode && this.gameData) {
      this.scheduleService.optimisticUpdateGame({
        id: this.gameData.id,
        ...input[0],
      });
    } else {
      this.scheduleService.optimisticAddGames(input);
    }


    // TODO: update gamesCache with the response, add toast
    const operation$ =
      this.editMode && this.gameData
        ? this.addGameService.updateGame({ id: this.gameData.id, ...input[0] })
        : (
            this.addGameService.addGame(input) as Observable<Partial<Game>[]>
          ).pipe(
            take(1),
            tap((response: Partial<Game>[]) => 
              this.scheduleService.syncGameIds(response)
            ),
          );

    operation$
      .pipe(take(1))
      .subscribe(() => this.addGameDialogService.closeDialog());
  }

  cancel() {
    this.addGameForm.reset();
    this.addGameDialogService.closeDialog();
  }
}
