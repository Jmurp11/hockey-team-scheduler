import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingService } from '../../shared/services/loading.service';
import { ButtonModule } from 'primeng/button';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { AddGameService } from './add-game.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { AutoCompleteComponent } from '../../shared/components/auto-complete/auto-complete.component';
import { SelectButtonComponent } from '../../shared/components/select-button/select-button.component';

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
            [parentForm]="addGameForm"
            fcName="opponent"
          ></app-auto-complete>
          <app-input [parentForm]="addGameForm" fcName="rink"></app-input>
          <app-auto-complete
            [parentForm]="addGameForm"
            fcName="city"
          ></app-auto-complete>
          <app-auto-complete
            [parentForm]="addGameForm"
            fcName="state"
          ></app-auto-complete>
          <app-auto-complete
            [parentForm]="addGameForm"
            fcName="country"
          ></app-auto-complete>
          <app-select-button
            [parentForm]="addGameForm"
            fcName="gameType"
            [options]="gameTypeOptions"
          ></app-select-button>
          <app-select-button
            [parentForm]="addGameForm"
            fcName="isHome"
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
