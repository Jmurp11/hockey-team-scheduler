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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TeamsService } from '@hockey-team-scheduler/shared-data-access';
import {
    checkProfileField,
    getFormControl,
    getInputType,
    Profile,
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
                    [formControl]="getFormControl(profileUpdateForm, field.controlName)"
                    [type]="getInputType(field.type)"
                    [label]="field.labelName"
                    labelPlacement="stacked"
                    fill="outline"
                    [placeholder]="'Enter ' + field.labelName"
                  />
                }
                @case ('select') {
                  @if (field.controlName === 'association') {
                    <app-select
                      [formControl]="getFormControl(profileUpdateForm, field.controlName)"
                      [label]="field.labelName"
                      labelPlacement="stacked"
                      fill="outline"
                      [placeholder]="'Select ' + field.labelName"
                      [disabled]="field.disabled || false"
                    >
                      <ion-select-option [value]="null">Select Association</ion-select-option>
                    </app-select>
                  } @else if (field.controlName === 'team') {
                    <app-select
                      [formControl]="getFormControl(profileUpdateForm, field.controlName)"
                      [label]="field.labelName"
                      labelPlacement="stacked"
                      fill="outline"
                      [placeholder]="'Select ' + field.labelName"
                      [disabled]="field.disabled || false"
                    >
                      <ion-select-option [value]="null">Select Team</ion-select-option>
                      @for (team of teams; track team.value) {
                        <ion-select-option [value]="team.value">{{ team.label }}</ion-select-option>
                      }
                    </app-select>
                  }
                }
              }
            }
          </form>

          <div class="button-group">
            <app-button
              fill="clear"
              color="medium"
              (onClick)="cancel()"
            >
              Reset
            </app-button>
            <app-button
              color="primary"
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
  styles: [`
    app-input,
    app-select {
      margin-bottom: 1rem;
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
  `],
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
    this.profileUpdateForm = this.initProfileFormGroup();

    this.teams$ = this.teamsService.getTeams({
      association: this.card.association.value,
    });
  }

  initProfileFormGroup() {
    return new FormGroup({
      display_name: new FormControl(this.checkField(this.card.display_name)),
      association: new FormControl(this.checkField(this.card.association)),
      team: new FormControl(this.checkField(this.card.team)),
      email: new FormControl(this.checkField(this.card.email)),
    });
  }

  cancel() {
    this.profileUpdateForm.patchValue({
      display_name: this.checkField(this.card.display_name),
      association: this.checkField(this.card.association),
      team: this.checkField(this.card.team),
      email: this.checkField(this.card.email),
    });
    this.profileUpdateForm.markAsPristine();
  }

  submit() {
    this.formSubmit.emit(this.profileUpdateForm.value);
    this.profileUpdateForm.markAsPristine();
  }
}
