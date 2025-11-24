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
    Profile,
} from '@hockey-team-scheduler/shared-utilities';
import { SelectItem } from 'primeng/api';
import { Button } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable } from 'rxjs/internal/Observable';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { getFormFields } from './profile.constants';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  providers: [TeamsService],
  imports: [
    CommonModule,
    Button,
    CardComponent,
    InputComponent,
    AutoCompleteComponent,
    ReactiveFormsModule,
    ProgressSpinnerModule,
  ],
  template: `
    @if (teams$ | async; as teams) {
    <app-card class="card">
      <ng-template #title>Profile Information</ng-template>
      <ng-template #subtitle>Update your profile information</ng-template>
      <ng-template #content>
        <form [formGroup]="profileUpdateForm">
          <div class="info_row">
            @for (field of formFields; track field.controlName) { @switch
            (field.controlType) { @case ('input') {
            <app-input
              class="info_row__item"
              [control]="getFormControl(profileUpdateForm, field.controlName)"
              [label]="field.labelName"
            />
            } @case ('autocomplete') { @if (field.controlName === 'association')
            {
            <app-auto-complete
              class="info_row__item"
              [control]="getFormControl(profileUpdateForm, field.controlName)"
              [label]="field.labelName"
              [items]="[]"
              [disabled]="field.disabled || false"
            />} @else if (field.controlName === 'team') {
            <app-auto-complete
              class="info_row__item"
              [control]="getFormControl(profileUpdateForm, field.controlName)"
              [label]="field.labelName"
              [items]="(teams$ | async) || []"
              [disabled]="field.disabled || false"
            />
            } } }}
          </div>
        </form>
      </ng-template>
      <ng-template #footer>
        <div class="button-group">
          <p-button
            label="Reset"
            [text]="true"
            severity="secondary"
            (click)="cancel()"
          />
          <p-button
            label="Submit"
            (click)="submit()"
            [disabled]="!profileUpdateForm.dirty || profileUpdateForm.invalid"
          ></p-button>
        </div>
      </ng-template>
    </app-card>
    } @else {
    <div class="loading-spinner">
      <p-progressSpinner />
    </div>
    }
  `,
  styleUrls: ['./profile-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileContentComponent implements OnInit {
  @Input() card: Profile;

  @Output() formSubmit = new EventEmitter<any>();

  private teamsService = inject(TeamsService);

  teams$: Observable<SelectItem[]> = new Observable<SelectItem[]>();

  formFields = getFormFields();

  getFormControl = getFormControl;
  checkField = checkProfileField;

  profileUpdateForm: FormGroup;

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
      association: this.checkField(this.card.association_name),
      team: this.checkField(this.card.team_name),
      age: this.checkField(this.card.age),
      email: this.checkField(this.card.email),
    });
    this.profileUpdateForm.markAsPristine();
  }

  submit() {
    this.formSubmit.emit(this.profileUpdateForm.value);
    this.profileUpdateForm.markAsPristine();
  }
}
