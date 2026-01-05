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
import { AssociationsService, AuthService, TeamsService, UserService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService, NavigationService } from '@hockey-team-scheduler/shared-ui';
import { confirmPasswordValidator, getFormControl } from '@hockey-team-scheduler/shared-utilities';
import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonSelectOption,
    IonSpinner,
} from '@ionic/angular/standalone';
import { SelectItem } from 'primeng/api';
import { Observable, startWith, switchMap } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';
import { PasswordInputComponent } from '../../shared/password-input/password-input.component';
import { SelectComponent } from '../../shared/select/select.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSelectOption,
    IonSpinner,
    InputComponent,
    PasswordInputComponent,
    ButtonComponent,
    SelectComponent,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="auth-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Complete Profile</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            @if (associations$ | async; as associations) {
              <form [formGroup]="registerForm" (ngSubmit)="submit()">
                <app-input
                  [formControl]="getFormControl(registerForm, 'email')"
                  type="email"
                  label="Email"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder="Enter your email"
                  [required]="true"
                />

                <app-password-input
                  [formControl]="getFormControl(registerForm, 'password')"
                  label="Password"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder="Enter your password (min 10 characters)"
                  [required]="true"
                />

                <app-password-input
                  [formControl]="getFormControl(registerForm, 'confirmPassword')"
                  label="Confirm Password"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder="Confirm your password"
                  [required]="true"
                />

                <app-input
                  [formControl]="getFormControl(registerForm, 'name')"
                  type="text"
                  label="Name"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder="Enter your name"
                  [required]="true"
                />

                <app-select
                  [formControl]="getFormControl(registerForm, 'association')"
                  label="Association"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder="Select an association"
                  interface="action-sheet"
                >
                  @for (association of associations; track association.value) {
                    <ion-select-option [value]="association">
                      {{ association.label }}
                    </ion-select-option>
                  }
                </app-select>

                @if (teams$ | async; as teams) {
                  @if (teams.length > 0) {
                    <app-select
                      [formControl]="getFormControl(registerForm, 'team')"
                      label="Team"
                      labelPlacement="stacked"
                      fill="outline"
                      placeholder="Select a team"
                      interface="action-sheet"
                    >
                      @for (team of teams; track team.value) {
                        <ion-select-option [value]="team">
                          {{ team.label }}
                        </ion-select-option>
                      }
                    </app-select>
                  }
                }

                <div class="form-actions">
                  <app-button
                    type="submit"
                    expand="block"
                    color="primary"
                    [disabled]="registerForm.invalid || loadingService.isLoading()"
                  >
                    {{ loadingService.isLoading() ? 'Submitting...' : 'Submit' }}
                  </app-button>
                </div>
              </form>
            } @else {
              <div class="loading-spinner">
                <ion-spinner></ion-spinner>
              </div>
            }
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: transparent;
    }

    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
      padding: 1rem;
    }

    ion-card {
      width: 100%;
      max-width: 600px;
      margin: 0;
    }

    app-input,
    app-select,
    app-password-input {
      margin-bottom: 1rem;
    }

    .form-actions {
      margin: 2rem 0 1rem 0;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  associationsService = inject(AssociationsService);
  authService = inject(AuthService);
  teamsService = inject(TeamsService);
  userService = inject(UserService);
  navigation = inject(NavigationService);

  teams: SelectItem[] = [];
  associations$: Observable<SelectItem[]> = new Observable<SelectItem[]>();
  teams$: Observable<SelectItem[]> = new Observable<SelectItem[]>();
  registerForm!: FormGroup;

  getFormControl = getFormControl;

  async ngOnInit() {
    this.registerForm = this.initForm();
    this.associations$ = this.associationsService.getAssociations();
    this.teams$ = this.onAssociationChange();
  }

  initForm() {
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
}
