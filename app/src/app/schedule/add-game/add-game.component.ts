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
import { ButtonModule } from 'primeng/button';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectButtonComponent } from '../../shared/components/select-button/select-button.component';
import { LoadingService } from '../../shared/services/loading.service';
import { getFormControl } from '../../shared/utilities/form.utility';
import { AddGameService } from './add-game.service';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteComponent,
    InputComponent,
    DialogComponent,
    ButtonModule,
    SelectButtonComponent,
  ],
  providers: [LoadingService],
  template: `
    <form [formGroup]="addGameForm">
      <app-dialog [visible]="addGameService.isVisible()">
        <ng-template #header>
          <div class="dialog-header">
            <span><h2>Add Game</h2></span>
            <span
              ><p-button
                icon="pi pi-sparkles"
                [rounded]="true"
                [text]="true"
              />
            </span>
          </div>
        </ng-template>
        <div>
          <app-auto-complete
            [control]="getFormControl(addGameForm, 'opponent')" label="Opponent"
            
          ></app-auto-complete>
          <app-input [control]="getFormControl(addGameForm, 'rink')" label="Rink"/>
          <app-auto-complete
            [control]="getFormControl(addGameForm, 'city')"
            label="City"
          ></app-auto-complete>
          <app-auto-complete
            [control]="getFormControl(addGameForm, 'state')"
            label="State"
          ></app-auto-complete>
          <app-auto-complete
            [control]="getFormControl(addGameForm, 'country')"
            label="Country"
          ></app-auto-complete>
          <app-select-button
            [control]="getFormControl(addGameForm, 'gameType')"
            label="Game Type"
            [options]="gameTypeOptions"
          ></app-select-button>
          <app-select-button
            [control]="getFormControl(addGameForm, 'isHome')"
            label="Is Home"
            [options]="isHomeOptions"
          ></app-select-button>
        </div>
        <ng-template #footer>
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (click)="addGameService.closeDialog()"
          />
          <p-button label="Submit" (click)="submit()"></p-button>
        </ng-template>
      </app-dialog>
    </form>
  `,
  styleUrls: ['./add-game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddGameComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  addGameService = inject(AddGameService);

  gameTypeOptions = [
    { label: 'League', value: 'league' },
    { label: 'Playoff', value: 'playoff' },
    { label: 'Tournament', value: 'tournament' },
    { label: 'Exhibition', value: 'exhibition' },
  ];

  isHomeOptions = [
    { label: 'Home', value: 'home' },
    { label: 'Away', value: 'away' },
  ];

  getFormControl = getFormControl;
  
  addGameForm: FormGroup = new FormGroup({
    opponent: new FormControl(null, {
      validators: [Validators.required, Validators.email],
    }),
    rink: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    city: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    state: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    country: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    gameType: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    isHome: new FormControl(null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  ngOnInit() {
    console.log('addGameService', this.addGameService.isVisible());
  }
  submit() {
    console.log('submitted');
  }
}
