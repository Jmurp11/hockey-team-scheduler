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
import { DatetimeButtonComponent } from '../../shared/datetime-button/datetime-button.component';
import { InputComponent } from '../../shared/input/input.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { SegmentComponent } from '../../shared/segment/segment.component';
import { SelectComponent } from '../../shared/select/select.component';
import { AddGameModalService } from './add-game-modal.service';
import { getFormFields } from './add-game.constants';

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
    IonSelectOption,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    LoadingComponent,
    DatetimeButtonComponent,
    SegmentComponent,
    IonSegmentButton,
    AutocompleteComponent,
  ],
  template: `
    <ion-modal [isOpen]="addGameModalService.isOpen()" (didDismiss)="cancel()">
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
                    <ion-item lines="none">
                      <app-input
                        [type]="'text'"
                        [label]="field.labelName"
                        [labelPlacement]="'stacked'"
                        [fill]="'outline'"
                        [formControl]="getFormControl(field.controlName)"
                      />
                    </ion-item>
                  }
                  @case ('select') {
                    <ion-item lines="none">
                      <app-select
                        [label]="field.labelName"
                        [labelPlacement]="'stacked'"
                        [fill]="'outline'"
                        [formControl]="getFormControl(field.controlName)"
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
                  @case ('autocomplete') {
                    <ion-item lines="none">
                      <app-autocomplete
                        [label]="field.labelName"
                        [labelPlacement]="'stacked'"
                        [fill]="'outline'"
                        [interface]="'action-sheet'"
                        [formControl]="getFormControl(field.controlName)"
                        [options]="field.items"
                      />
                    </ion-item>
                  }
                }
              }
            }

            <ion-item lines="none">
              <ion-label position="stacked">Date & Time</ion-label>
              <app-datetime-button [datetime]="'game-datetime'" />
            </ion-item>

            <ion-item lines="none" style="display: none;">
              <ion-datetime
                id="game-datetime"
                name="game-datetime"
                presentation="date-time"
                [formControl]="getFormControl('date')"
              />
            </ion-item>

            <ion-item lines="none">
              <app-segment
                [value]="gameTypeOptions[0].value"
                [formControl]="getFormControl('gameType')"
              >
                @for (option of gameTypeOptions; track option.value) {
                  <ion-segment-button [value]="option.value">
                    <ion-label>{{ option.label }}</ion-label>
                  </ion-segment-button>
                }
              </app-segment>
            </ion-item>

            <ion-item lines="none">
              <app-segment
                [value]="isHomeOptions[0].value"
                [formControl]="getFormControl('isHome')"
              >
                @for (option of isHomeOptions; track option.value) {
                  <ion-segment-button [value]="option.value">
                    <ion-label>{{ option.label }}</ion-label>
                  </ion-segment-button>
                }
              </app-segment>
            </ion-item>

            <div class="button-container">
              <app-button
                [expand]="'block'"
                [color]="'medium'"
                [fill]="'outline'"
                (onClick)="cancel()"
              >
                Cancel
              </app-button>
              <app-button
                [expand]="'block'"
                [color]="'primary'"
                [disabled]="!addGameForm.valid"
                (onClick)="submit()"
              >
                {{ editMode() ? 'Update' : 'Add' }} Game
              </app-button>
            </div>
          </form>
        } @else {
          <div class="loading-container">
            <app-loading [color]="'secondary'" />
          </div>
        }
      </ion-content>
    </ion-modal>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .button-container {
        display: flex;
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

    this.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => (this.formFieldsData = getFormFields(items)));
  }

  private initGameForm(): FormGroup {
    return initAddGameForm(this.gameData());
  }

  getFormControl(controlName: string): FormControl {
    if (!controlName || !this.addGameForm) {
      console.warn('Invalid control name or form not initialized:', controlName);
      return new FormControl();
    }
    const control = this.addGameForm.get(controlName);
    if (!control) {
      console.warn('Form control not found:', controlName);
      return new FormControl();
    }
    return control as FormControl;
  }

  submit(): void {
    if (!this.addGameForm.valid) {
      return;
    }

    const input = transformAddGameFormData(
      this.addGameForm.value,
      this.currentUser().user_id,
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
