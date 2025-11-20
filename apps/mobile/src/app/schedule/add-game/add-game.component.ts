import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    AddGameService,
    AuthService,
    ScheduleService,
    TeamsService,
} from '@hockey-team-scheduler/shared-data-access';
import { getAddGameFormFields, setSelect } from '@hockey-team-scheduler/shared-utilities';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonHeader,
    IonItem,
    IonLabel,
    IonSelectOption,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { take } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { DatetimeButtonComponent } from '../../shared/datetime-button/datetime-button.component';
import { InputComponent } from '../../shared/input/input.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SelectComponent } from '../../shared/select/select.component';
import { AddGameModalService } from './add-game-modal.service';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    LoadingComponent,
    DatetimeButtonComponent,
  ],
  template: `
    <app-modal 
      [isOpen]="addGameModalService.isOpen()" 
      (didDismiss)="cancel()"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ title() }}</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="cancel()">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        @if (loading()) {
          <app-loading />
        } @else {
          <form [formGroup]="addGameForm">
            @for (field of formFieldsData(); track field.controlName) {
              @switch (field.controlType) {
                @case ('input') {
                  <app-input
                    [type]="'text'"
                    [label]="field.labelName"
                    [labelPlacement]="'stacked'"
                    [fill]="'outline'"
                    [formControl]="getFormControl(field.controlName)"
                  />
                }
                @case ('select') {
                  <app-select
                    [label]="field.labelName"
                    [labelPlacement]="'stacked'"
                    [fill]="'outline'"
                    [formControl]="getFormControl(field.controlName)"
                  >
                    @for (option of field.options?.listItems; track option.value) {
                      <ion-select-option [value]="option.value">
                        {{ option.label }}
                      </ion-select-option>
                    }
                  </app-select>
                }
                @case ('autocomplete') {
                  <app-select
                    [label]="field.labelName"
                    [labelPlacement]="'stacked'"
                    [fill]="'outline'"
                    [interface]="'action-sheet'"
                    [formControl]="getFormControl(field.controlName)"
                  >
                    @if (field.items) {
                      @for (item of field.items; track item.value) {
                        <ion-select-option [value]="item.value">
                          {{ item.label }}
                        </ion-select-option>
                      }
                    }
                  </app-select>
                }
              }
            }

            <ion-item>
              <ion-label position="stacked">Date & Time</ion-label>
              <app-datetime-button datetime="game-datetime" />
            </ion-item>
            
            <ion-item style="display: none;">
              <ion-datetime 
                id="game-datetime"
                presentation="date-time"
                [formControl]="getFormControl('date')"
              />
            </ion-item>

            <app-select
              [label]="'Game Type'"
              [labelPlacement]="'stacked'"
              [fill]="'outline'"
              [formControl]="getFormControl('game_type')"
            >
              @for (option of gameTypeOptions; track option.value) {
                <ion-select-option [value]="option.value">
                  {{ option.label }}
                </ion-select-option>
              }
            </app-select>

            <app-select
              [label]="'Home/Away'"
              [labelPlacement]="'stacked'"
              [fill]="'outline'"
              [formControl]="getFormControl('isHome')"
            >
              @for (option of isHomeOptions; track option.value) {
                <ion-select-option [value]="option.value">
                  {{ option.label }}
                </ion-select-option>
              }
            </app-select>

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
        }
      </ion-content>
    </app-modal>
  `,
  styles: [`
    .button-container {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    ion-item {
      --padding-start: 0;
      margin-bottom: 1rem;
    }

    app-input, app-select {
      margin-bottom: 1rem;
    }
  `],
})
export class AddGameComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private teamsService = inject(TeamsService);
  private addGameService = inject(AddGameService);
  addGameModalService = inject(AddGameModalService);

  loading = signal(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formFieldsData = signal<any[]>([]);
  
  editMode = this.addGameModalService.editMode;
  gameData = this.addGameModalService.gameData;
  
  title = computed(() => (this.editMode() ? 'Update Game' : 'Add Game'));
  
  currentUser = this.authService.currentUser();
  
  gameTypeOptions = [
    setSelect('League', 'league'),
    setSelect('Playoff', 'playoff'),
    setSelect('Tournament', 'tournament'),
    setSelect('Exhibition', 'exhibition'),
  ];
  
  isHomeOptions = [
    setSelect('Home', 'home'), 
    setSelect('Away', 'away')
  ];

  addGameForm!: FormGroup;

  ngOnInit(): void {
    this.addGameForm = this.initGameForm();
    this.loadTeamsAndFormFields();
  }

  private loadTeamsAndFormFields(): void {
    this.loading.set(true);
    this.teamsService
      .teams({ age: this.currentUser.age })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formFields = getAddGameFormFields(items as any[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.formFieldsData.set(formFields as any[]);
        this.loading.set(false);
      });
  }

  private initGameForm(): FormGroup {
    const data = this.gameData();
    return new FormGroup({
      opponent: new FormControl(data?.opponent || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      rink: new FormControl(data?.rink || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      city: new FormControl(data?.city || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      state: new FormControl(data?.state || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      country: new FormControl(data?.country || null, {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      date: new FormControl(data?.date || null, {
        validators: [Validators.required],
      }),
      game_type: new FormControl(data?.game_type || null, {
        validators: [Validators.required],
      }),
      isHome: new FormControl(data?.isHome || null, {
        validators: [Validators.required],
      }),
    });
  }

  getFormControl(controlName: string): FormControl {
    return this.addGameForm.get(controlName) as FormControl;
  }

  submit(): void {
    if (!this.addGameForm.valid) {
      return;
    }

    const dateValue = this.addGameForm.value.date;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

    const input = [
      {
        ...this.addGameForm.value,
        country: this.addGameForm.value.country.value || this.addGameForm.value.country,
        state: this.addGameForm.value.state.value || this.addGameForm.value.state,
        opponent: [this.addGameForm.value.opponent.value || this.addGameForm.value.opponent],
        isHome: this.addGameForm.value.isHome === 'home',
        user: this.currentUser.user_id,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        time: date.toTimeString().split(' ')[0],
      },
    ];

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

    const operation$ = this.editMode() && data
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
