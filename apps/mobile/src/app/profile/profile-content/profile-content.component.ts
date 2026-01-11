import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TeamsService } from '@hockey-team-scheduler/shared-data-access';
import {
  checkProfileField,
  getFormControl,
  getInputType,
  initProfileForm,
  Profile,
  resetProfileForm,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular/standalone';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs/internal/Observable';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { InputComponent } from '../../shared/input/input.component';
import { SelectComponent } from '../../shared/select/select.component';
import { getFormFields } from './profile.constants';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  providers: [],
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SelectComponent,
    ReactiveFormsModule,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonSelectOption,
  ],
  template: `
    @if (teams$ | async; as teams) {
      <app-card>
        <ion-card-header>
          <ion-card-title>Profile Information</ion-card-title>
          <ion-card-subtitle>Update your profile information</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <form [formGroup]="profileUpdateForm">
            @for (field of formFields; track field.controlName) {
              @switch (field.controlType) {
                @case ('input') {
                  <app-input
                    [formControl]="
                      getFormControl(profileUpdateForm, field.controlName)
                    "
                    [type]="getInputType(field.type)"
                    [label]="field.labelName"
                    labelPlacement="stacked"
                    fill="outline"
                    [placeholder]="'Enter ' + field.labelName"
                  />
                }
                @case ('select') {
                  @if (field.controlName === 'team') {
                    <app-select
                      [formControl]="
                        getFormControl(profileUpdateForm, field.controlName)
                      "
                      [label]="field.labelName"
                      labelPlacement="stacked"
                      [interface]="'action-sheet'"
                      fill="outline"
                      [placeholder]="'Select ' + field.labelName"
                      [disabled]="field.disabled || false"
                    >
                      <ion-select-option [value]="null"
                        >Select Team</ion-select-option
                      >
                      @for (team of teams; track team.value) {
                        <ion-select-option [value]="team.value">{{
                          team.label
                        }}</ion-select-option>
                      }
                    </app-select>
                  }
                }
              }
            }
          </form>

          <div class="button-group">
            <app-button fill="clear" color="medium" (onClick)="cancel()">
              Reset
            </app-button>
            <app-button
              color="secondary"
              (onClick)="submit()"
              [disabled]="!profileUpdateForm.dirty || profileUpdateForm.invalid"
            >
              Submit
            </app-button>
          </div>
        </ion-card-content>
      </app-card>
    } @else {
      <div class="loading-spinner">
        <ion-spinner></ion-spinner>
      </div>
    }
  `,
  styles: [
    `
      app-input,
      app-select {
        padding: 1rem;
      }

      .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileContentComponent implements OnInit {
  @Input() card!: Profile;

  @Output() formSubmit = new EventEmitter<Profile>();

  private teamsService = inject(TeamsService);

  teams$: Observable<SelectItem[]> = new Observable<SelectItem[]>();

  formFields = getFormFields();

  getFormControl = getFormControl;
  getInputType = getInputType;
  checkField = checkProfileField;

  profileUpdateForm!: FormGroup;

  destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.profileUpdateForm = initProfileForm(this.card);

    // For ion-select, we need to use just the value (id) not the SelectOption object
    // because ion-select compares values directly
    if (this.card.team?.value) {
      this.profileUpdateForm.get('team')?.setValue(this.card.team.value);
    }

    this.teams$ = this.teamsService.getTeams({
      association: this.card.association.value,
    });
  }

  initProfileFormGroup() {
    return initProfileForm(this.card);
  }

  cancel() {
    resetProfileForm(this.profileUpdateForm, this.card);
    // Reset team to just the value for ion-select
    if (this.card.team?.value) {
      this.profileUpdateForm.get('team')?.setValue(this.card.team.value);
    }
  }

  submit() {
    this.formSubmit.emit(this.profileUpdateForm.value);
    this.profileUpdateForm.markAsPristine();
  }
}
