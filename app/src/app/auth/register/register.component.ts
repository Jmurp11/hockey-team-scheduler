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
import { Observable, tap } from 'rxjs';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { PasswordComponent } from '../../shared/components/password/password.component';
import { AssociationService } from '../../shared/services/associations.service';
import { LoadingService } from '../../shared/services/loading.service';
import { NavigationService } from '../../shared/services/navigation.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { TeamsService } from '../../shared/services/teams.service';
import { AuthService } from '../auth.service';
import { confirmPasswordValidator } from '../update-password/password-match.validator';
import { UserService } from '../user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ReactiveFormsModule,
    InputComponent,
    PasswordComponent,
    AutoCompleteComponent,
    ButtonModule,
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
    <div class="register-container">
      <app-card class="card">
        <ng-template #title>Complete Profile</ng-template>
        <ng-template #content>
          <form [formGroup]="registerForm" (ngSubmit)="submit()">
            <app-input [parentForm]="registerForm" fcName="email" />

            <app-password
              [parentForm]="registerForm"
              fcName="password"
            />

            <app-password
              [parentForm]="registerForm"
              fcName="confirmPassword"
            />

            <app-input [parentForm]="registerForm" fcName="name" />

            <app-auto-complete
              [parentForm]="registerForm"
              fcName="association"
              [items]="associations"
            />

            @if (teamsObs$ | async) {
            <app-auto-complete
              [parentForm]="registerForm"
              fcName="team"
              [items]="teams"
            />
            }

            <div class="form-actions">
              <p-button
                type="submit"
                label="Submit"
                [disabled]="registerForm.invalid || loadingService.isLoading()"
                [loading]="loadingService.isLoading()"
                styleClass="w-full"
              >
              </p-button>
            </div>
          </form>
        </ng-template>
        <ng-template #footer> </ng-template>
      </app-card>
    </div>
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

  associations: SelectItem[] = [];

  teams: SelectItem[] = [];

  teamsObs$: Observable<void> | undefined;

  navigation = inject(NavigationService);

  registerForm: FormGroup;

  async ngOnInit() {
    this.registerForm = this.initForm();

    this.loadAssociations();

    this.teamsObs$ = this.registerForm.get('association')?.valueChanges.pipe(
      tap(() => {
        this.loadTeams();
      })
    );
  }

  initForm() {
    return new FormGroup(
      {
        email: new FormControl(
          this.authService.session()?.user?.email ?? null,
          {
            validators: [Validators.required, Validators.email],
          }
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
      { validators: confirmPasswordValidator }
    );
  }
  async loadAssociations() {
    this.associations = await this.formatAssociations();
  }

  async loadTeams() {
    this.teams = await this.formatTeams();
  }

  async formatAssociations(): Promise<SelectItem[]> {
    const { data, error } = await this.associationsService.associations();

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((association) => ({
      label: association.name,
      value: association.id,
    }));
  }

  async formatTeams(): Promise<SelectItem[]> {
    const association = this.registerForm.get('association')?.value;

    if (!association || !association.value) {
      return [];
    }

    const associationId = association.value;

    const { data } = await this.teamsService.teams(associationId);

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((team) => ({ label: team.team_name, value: team.id }));
  }

  async submit() {
    const submission = {
      ...this.registerForm.value,
      association: this.registerForm.get('association')?.value?.value,
      team: this.registerForm.get('team')?.value?.value,
    };

    await this.userService.updateUserProfile(submission);

    this.navigation.navigateToLink('/app/dashboard');
  }

  getPasswordErrors() {
    return this.registerForm.get('password')?.valueChanges.pipe(
      tap((password) => {
        console.log({ password });
        console.log(this.registerForm.get('password')?.errors);
      })
    );
  }
}
