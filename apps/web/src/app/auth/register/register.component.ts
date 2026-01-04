import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Observable, startWith, switchMap } from 'rxjs';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { PasswordComponent } from '../../shared/components/password/password.component';
import { AssociationService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';

import { NavigationService } from '@hockey-team-scheduler/shared-ui';

import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { TeamsService } from '@hockey-team-scheduler/shared-data-access';
import { getFormControl } from '@hockey-team-scheduler/shared-utilities';
import { AuthContainerComponent } from '../auth-container/auth-container.component';
import {
  AuthService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import { confirmPasswordValidator } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    AuthContainerComponent,
    CommonModule,
    CardComponent,
    ReactiveFormsModule,
    InputComponent,
    PasswordComponent,
    AutoCompleteComponent,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  providers: [
    LoadingService,
    NavigationService,
    AssociationService,
    TeamsService,
    SupabaseService,
    UserService,
  ],
  template: `
    <app-auth-container>
      <app-card class="card">
        <ng-template #title>Complete Profile</ng-template>
        <ng-template #content>
          @if (associations$ | async; as associations) {
            <form [formGroup]="registerForm" (ngSubmit)="submit()">
              <app-input
                [control]="getFormControl(registerForm, 'email')"
                label="Email"
              />

              <app-password
                [control]="getFormControl(registerForm, 'password')"
                label="Password"
              />

              <app-password
                [control]="getFormControl(registerForm, 'confirmPassword')"
                label="Confirm Password"
              />

              <app-input
                [control]="getFormControl(registerForm, 'name')"
                label="Name"
              />

              <app-input
                [control]="getFormControl(registerForm, 'phone')"
                label="Phone Number"
              />

              <app-auto-complete
                [control]="getFormControl(registerForm, 'association')"
                label="Association"
                [items]="associations"
              />
              @if (teams$ | async; as teams) {
                @if (teams.length > 0) {
                  <app-auto-complete
                    [control]="getFormControl(registerForm, 'team')"
                    label="Team"
                    [items]="teams"
                  />
                }
              }

              <div class="form-actions">
                <p-button
                  type="submit"
                  label="Submit"
                  [disabled]="
                    registerForm.invalid || loadingService.isLoading()
                  "
                  [loading]="loadingService.isLoading()"
                  styleClass="w-full"
                >
                </p-button>
              </div>
            </form>
          } @else {
            <div class="loading-spinner">
              <p-progressSpinner></p-progressSpinner>
            </div>
          }
        </ng-template>

        <ng-template #footer> </ng-template>
      </app-card>
    </app-auth-container>
  `,
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  protected loadingService = inject(LoadingService);

  associationsService = inject(AssociationService);

  authService = inject(AuthService);

  teamsService = inject(TeamsService);

  userService = inject(UserService);

  teams: SelectItem[] = [];

  associations$: Observable<SelectItem[]> = new Observable<SelectItem[]>();

  teams$: Observable<SelectItem[]> = new Observable<SelectItem[]>();

  navigation = inject(NavigationService);

  registerForm: FormGroup;

  getFormControl = getFormControl;

  async ngOnInit() {
    this.registerForm = this.initForm();

    this.associations$ = this.associationsService.getAssociations();

    this.teams$ = this.onAssociationChange();
  }

  initForm() {
    const phoneRegex = /^\d{10}$/;
    return new FormGroup(
      {
        email: new FormControl(
          this.authService.session()?.user?.email ?? null,
          {
            validators: [Validators.required, Validators.email],
          },
        ),
        password: new FormControl(null, {
          validators: [Validators.required, Validators.minLength(10)],
        }),
        confirmPassword: new FormControl(null, {
          validators: [Validators.required],
        }),
        name: new FormControl(null, {
          validators: [Validators.required],
        }),
        phone: new FormControl(null, {
          validators: [
            Validators.required,
            Validators.minLength(10),
            Validators.pattern(phoneRegex),
          ],
        }),
        association: new FormControl(null, {
          validators: [Validators.required],
        }),
        team: new FormControl(null, {
          validators: [Validators.required],
        }),
      },
      { validators: confirmPasswordValidator },
    );
  }

  onAssociationChange(): Observable<SelectItem[]> {
    const associationControl = this.registerForm.get('association');
    if (!associationControl) {
      return new Observable<SelectItem[]>();
    }

    return associationControl.valueChanges.pipe(
      startWith(associationControl.value),
      switchMap((association) => {
        if (!association) {
          return new Observable<SelectItem[]>((observer) => {
            observer.next([]);
            observer.complete();
          });
        }

        return this.teamsService.getTeams({ association: association.value });
      }),
    );
  }

  async submit() {
    const submission = {
      ...this.registerForm.value,
      association: this.registerForm.get('association')?.value?.value,
      team: this.registerForm.get('team')?.value?.value,
      age: this.userService.getAge(this.registerForm.get('team')?.value?.label),
      id: this.authService.session()?.user?.id,
    };

    await this.userService.updateUserProfile(submission);

    this.navigation.navigateToLink('/app/schedule');
  }

  getPasswordErrors() {
    return this.registerForm.get('password')?.valueChanges;
  }
}
