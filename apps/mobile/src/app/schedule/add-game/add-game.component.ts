import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AddGameService,
  AuthService,
  RinksService,
  ScheduleService,
  TeamsService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  Game,
  GAME_TYPE_OPTIONS,
  initAddGameForm,
  IS_HOME_OPTIONS,
  transformAddGameFormData,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonItem,
  IonLabel,
  IonModal,
  IonSegmentButton,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { combineLatest, Observable, of, take } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { AutocompleteComponent } from '../../shared/autocomplete/autocomplete.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { SegmentComponent } from '../../shared/segment/segment.component';
import { SelectComponent } from '../../shared/select/select.component';
import { AddGameModalService } from './add-game-modal.service';
import { getFormFields } from './add-game.constants';
import { InputComponent } from '../../shared/input/input.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSelectOption,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    LoadingComponent,
    SegmentComponent,
    IonSegmentButton,
    AutocompleteComponent,
  ],
  template: `
    <ion-modal [isOpen]="addGameModalService.isOpen()" (didDismiss)="cancel()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ title() }}</ion-title>
            <ion-buttons slot="end">
              <ion-button color="secondary" (click)="cancel()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          @if (formFieldsData$ | async; as formFieldsData) {
            <form [formGroup]="addGameForm">
              @for (field of formFieldsData; track field.controlName) {
                @if (field && field.controlType) {
                  @switch (field.controlType) {
                    @case ('input') {
                      @if (getFormControl(field.controlName)) {
                        <ion-item lines="none">
                          <app-input
                            class="form-field"
                            [type]="'text'"
                            [label]="field.labelName"
                            [labelPlacement]="'stacked'"
                            [fill]="'outline'"
                            [formControl]="getFormControl(field.controlName)!"
                          />
                        </ion-item>
                      }
                    }
                    @case ('select') {
                      @if (getFormControl(field.controlName)) {
                        <ion-item lines="none">
                          <app-select
                            class="form-field"
                            [label]="field.labelName"
                            [interface]="'action-sheet'"
                            [labelPlacement]="'stacked'"
                            [fill]="'outline'"
                            [formControl]="getFormControl(field.controlName)!"
                          >
                            @for (
                              option of field.options?.listItems;
                              track option.value
                            ) {
                              <ion-select-option [value]="option.value">
                                {{ option.label }}
                              </ion-select-option>
                            }
                          </app-select>
                        </ion-item>
                      }
                    }
                    @case ('autocomplete') {
                      @if (getFormControl(field.controlName)) {
                        <ion-item lines="none">
                          <app-autocomplete
                            class="form-field"
                            [label]="field.labelName"
                            [labelPlacement]="'stacked'"
                            [fill]="'outline'"
                            [control]="getFormControl(field.controlName)!"
                            [items]="field.items"
                            [isRink]="field.isRink || false"
                            [allowAddNew]="field.allowAddNew || false"
                          />
                        </ion-item>
                      }
                    }
                    @case ('date-picker') {
                      <ion-item lines="none" class="date-time">
                        <ion-label position="stacked">Date & Time</ion-label>

                        <ion-datetime-button
                          datetime="datetime"
                        ></ion-datetime-button>

                        <ion-modal [keepContentsMounted]="true">
                          <ng-template>
                            <ion-datetime
                              id="datetime"
                              [formControlName]="field.controlName"
                            ></ion-datetime>
                          </ng-template>
                        </ion-modal>
                      </ion-item>
                    }
                  }
                }
              }

              @if (getFormControl('game_type')) {
                <ion-item lines="none">
                  <app-select
                    class="form-field"
                    label="Game Type"
                    [interface]="'action-sheet'"
                    [labelPlacement]="'stacked'"
                    [fill]="'outline'"
                    [formControl]="getFormControl('game_type')!"
                  >
                    @for (option of gameTypeOptions; track option.value) {
                      <ion-select-option [value]="option.value">
                        {{ option.label }}
                      </ion-select-option>
                    }
                  </app-select>
                </ion-item>
              }

              @if (getFormControl('isHome')) {
                <ion-item lines="none">
                  <div class="segment-item">
                    <app-segment [formControl]="getFormControl('isHome')!">
                      @for (option of isHomeOptions; track option.value) {
                        <ion-segment-button
                          [value]="option.value"
                          color="secondary"
                        >
                          <ion-label>{{ option.label }}</ion-label>
                        </ion-segment-button>
                      }
                    </app-segment>
                  </div>
                </ion-item>
              }
            </form>
          } @else {
            <div class="loading-container">
              <app-loading [color]="'secondary'" />
            </div>
          }
        </ion-content>

        <!-- Fixed bottom button -->
        <div class="bottom-button-container">
          <app-button
            [expand]="'block'"
            [color]="'secondary'"
            [disabled]="!addGameForm.valid"
            (onClick)="submit()"
          >
            {{ editMode() ? 'Update' : 'Add' }} Game
          </app-button>
        </div>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .form-field {
        width: 100%;
        max-height: 45px;
        margin: 0.75rem 0rem;
        padding: 0rem 0.5rem;
      }

      .segment-item {
        @include flex(center, center, row);
      }

      .date-time {
        @include flex(center, center, row);
        padding: 0rem 0.5rem;
        margin: 0.75rem 0rem;

        ion-datetime-button {
          padding: 0.5rem;
        }
      }

      .button-container {
        @include flex(space-between, center, row);
        gap: 1rem;
        margin-top: 2rem;
      }

      .loading-container {
        @include flex(center, center, column);
        height: 100%;
      }

      ion-item {
        --padding-start: 0;
        margin-bottom: 1rem;
      }

      app-input,
      app-select {
        margin-bottom: 1rem;
      }

      .bottom-button-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        background: var(--ion-background-color, #ffffff);
        border-top: 1px solid var(--ion-border-color, #e0e0e0);
        z-index: 1000;
      }

      ion-content {
        --padding-bottom: 80px; /* Add padding to prevent content from being hidden behind button */
      }
    `,
  ],
})
export class AddGameComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private teamsService = inject(TeamsService);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);
  private rinksService = inject(RinksService);
  addGameModalService = inject(AddGameModalService);

  currentUser = this.authService.currentUser();

  editMode = this.addGameModalService.editMode;
  gameData = this.addGameModalService.gameData;

  items$!: Observable<any>;
  formFieldsData$!: Observable<any[]>;

  title = computed(() => (this.editMode() ? 'Update Game' : 'Add Game'));

  addGameForm!: FormGroup;

  gameTypeOptions = GAME_TYPE_OPTIONS;

  isHomeOptions = IS_HOME_OPTIONS;

  private rinkValueChangesSub?: any;

  constructor() {
    // Effect to watch for changes in gameData or editMode and update validator
    effect(() => {
      const currentGameData = this.gameData();

      // Skip if form isn't initialized yet
      if (!this.addGameForm) {
        return;
      }

      // Reinitialize form when gameData changes
      this.addGameForm = initAddGameForm(currentGameData);

      // Re-subscribe to rink value changes after form is re-initialized
      this.subscribeToRinkValueChanges();
    });
  }

  private subscribeToRinkValueChanges() {
    // Unsubscribe previous if exists
    if (this.rinkValueChangesSub) {
      this.rinkValueChangesSub.unsubscribe();
    }
    const obs = this.rinkValueChanges();
    if (obs) {
      this.rinkValueChangesSub = obs
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rink: any) => this.handleRinkValueChange(rink));
    }
  }

  rinkValueChanges() {
    return this.addGameForm.get('rink')?.valueChanges;
  }

  handleRinkValueChange(value: any) {
    if (!value || typeof value === 'string') {
      this.addGameForm.get('city')?.setValue(null);
      this.addGameForm.get('state')?.setValue(null);
      this.addGameForm.get('country')?.setValue(null);
      this.addGameForm.get('city')?.enable();
      this.addGameForm.get('state')?.enable();
      this.addGameForm.get('country')?.enable();
      return;
    }

    this.addGameForm.get('city')?.setValue(value.city);
    this.addGameForm.get('state')?.setValue(value.state);
    this.addGameForm.get('country')?.setValue(value.country);
    this.addGameForm.get('city')?.disable();
    this.addGameForm.get('state')?.disable();
    this.addGameForm.get('country')?.disable();
  }

  ngOnInit(): void {
    // Initialize form
    this.addGameForm = initAddGameForm(this.gameData());

    this.items$ = combineLatest({
      teams: this.teamsService.teams({
        age: this.currentUser?.age,
      }),
      rinks: this.rinksService.getRinks(),
    });
    this.formFieldsData$ = this.items$.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(({ teams, rinks }) => of(getFormFields(teams, rinks))),
    );

    // Subscribe to rink value changes
    this.subscribeToRinkValueChanges();
  }

  getFormControl(controlName: string): FormControl | null {
    if (!controlName || !this.addGameForm) {
      return null;
    }
    const control = this.addGameForm.get(controlName);
    if (!control) {
      console.warn('Form control not found:', controlName);
      return null;
    }
    return control as FormControl;
  }

  handleGameTimeConflictError() {
    const dateControl = this.addGameForm.get('date');
    if (dateControl?.errors?.['gameTimeConflict']) {
      const conflictError = dateControl.errors['gameTimeConflict'];
      this.toastService.presentErrorToast(conflictError.message);
      return;
    }
  }

  submit(): void {
    // Check for validation errors including time conflicts
    if (!this.addGameForm.valid) {
      this.handleGameTimeConflictError();
      return;
    }

    const rawRink = this.addGameForm.getRawValue().rink;
    const rinkWrapper = typeof rawRink === 'string'
      ? { label: rawRink, value: rawRink }
      : { label: rawRink.rink, value: rawRink };
    const formValue = {
      ...this.addGameForm.getRawValue(),
      rink: rinkWrapper,
    };
    const input = transformAddGameFormData(
      formValue,
      this.currentUser?.user_id || null,
    );

    const data = this.gameData();

    const operation$ = this.chooseOperation(data, input);

    operation$
      .pipe(take(1))
      .subscribe((response) => this.handleSubscription(response));
  }

  cancel(): void {
    this.addGameForm.reset();
    this.addGameModalService.closeModal();
  }

  chooseOperation(data: any, input: any): Observable<Partial<Game>[]> {
    return this.editMode() && data
      ? this.handleUpdate(data, input)
      : (
          this.addGameService.addGame(input) as Observable<Partial<Game>[]>
        ).pipe(take(1));
  }

  handleUpdate(data: any, input: any): Observable<Partial<Game>[]> {
    this.scheduleService.setDeleteRecord(data.id);
    return this.addGameService
      .updateGame({ id: data.id, ...input[0] } as Partial<Game>)
      .pipe(
        take(1),
        switchMap((response: Partial<Game>) => of([response])),
      );
  }

  handleSubscription(response: any) {
    this.addGameModalService.closeModal();
    response &&
    (response.hasOwnProperty('opponent') ||
      (Array.isArray(response) && response[0].hasOwnProperty('opponent')))
      ? this.toastService.presentSuccessToast(
          `Game ${this.editMode() ? 'updated' : 'added'} successfully!`,
        )
      : this.toastService.presentErrorToast(
          `Failed to ${
            this.editMode() ? 'update' : 'add'
          } game. Please try again.`,
        );
  }
}
