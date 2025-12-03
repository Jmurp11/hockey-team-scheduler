import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AddGameService,
  AuthService,
  ScheduleService,
  TeamsService,
} from '@hockey-team-scheduler/shared-data-access';
import {
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
import { Observable, take } from 'rxjs';
import { AutocompleteComponent } from '../../shared/autocomplete/autocomplete.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { SegmentComponent } from '../../shared/segment/segment.component';
import { SelectComponent } from '../../shared/select/select.component';
import { AddGameModalService } from './add-game-modal.service';
import { getFormFields } from './add-game.constants';
import { InputComponent } from '../../shared/input/input.component';

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
              <ion-button (click)="cancel()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          @if (formFieldsData.length > 0) {
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
        height: 45px;
        margin: 0.75rem 0rem;
        padding: 0rem 0.5rem;
      }

      .date-time {
        @include flex(center, center, row);
        padding: 0rem 1rem;

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
  addGameModalService = inject(AddGameModalService);

  currentUser = this.authService.currentUser();

  editMode = this.addGameModalService.editMode;
  gameData = this.addGameModalService.gameData;

  items$!: Observable<any>;
  formFieldsData: any[] = [];

  title = computed(() => (this.editMode() ? 'Update Game' : 'Add Game'));

  addGameForm!: FormGroup;

  gameTypeOptions = GAME_TYPE_OPTIONS;

  isHomeOptions = IS_HOME_OPTIONS;

  ngOnInit(): void {
    this.addGameForm = initAddGameForm(this.gameData());

    this.items$ = this.teamsService.teams({
      age: this.currentUser.age,
    });

    this.items$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      this.formFieldsData = getFormFields(items);
    });
  }

  getFormControl(controlName: string): FormControl | null {
    if (!controlName || !this.addGameForm) {
      console.warn(
        'Invalid control name or form not initialized:',
        controlName,
      );
      return null;
    }
    const control = this.addGameForm.get(controlName);
    if (!control) {
      console.warn('Form control not found:', controlName);
      return null;
    }
    return control as FormControl;
  }

  submit(): void {
    if (!this.addGameForm.valid) {
      return;
    }
    const input = transformAddGameFormData(
      this.addGameForm.value,
      this.currentUser.user_id,
    );

    const data = this.gameData();

    // Optimistic update
    if (this.editMode() && data) {
      this.scheduleService.optimisticUpdateGame({
        id: data.id,
        ...input[0],
      });
    } else {
      this.scheduleService.optimisticAddGames(input);
    }

    const operation$ =
      this.editMode() && data
        ? this.addGameService.updateGame({ id: data.id, ...input[0] })
        : this.addGameService.addGame(input);

    operation$
      .pipe(take(1))
      .subscribe(() => this.addGameModalService.closeModal());
  }

  cancel(): void {
    this.addGameForm.reset();
    this.addGameModalService.closeModal();
  }
}
