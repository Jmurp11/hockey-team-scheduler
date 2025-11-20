import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonFabButton,
  IonFabList,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, peopleOutline, searchOutline, trophyOutline } from 'ionicons/icons';
import { FloatingActionButtonComponent } from '../../shared/floating-action-button/floating-action-button.component';
import { AddGameModalService } from '../add-game/add-game-modal.service';

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    FloatingActionButtonComponent,
    IonFabList,
    IonFabButton
  ],
  template: `
    <app-floating-action-button
      slot="fixed"
      [vertical]="'bottom'"
      [horizontal]="'end'"
    >
      <ion-fab-button>
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
      <ion-fab-list side="top">
        @for (action of actions; track action.label) {
          <ion-fab-button
            (click)="action.action()"
            [color]="action.color"
            aria-label="{{ action.label }}"
          >
            <ion-icon name="{{ action.icon }}"></ion-icon>
          </ion-fab-button>
        }
      </ion-fab-list>
    </app-floating-action-button>
  `,
  styles: [
    `
      .actions-container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .secondary-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
    `,
  ],
})
export class ScheduleActionsComponent {
  private addGameModalService = inject(AddGameModalService);
  private router = inject(Router);

  actions = [
    {
      label: 'Add Game',
      icon: 'add-outline',
      color: 'primary',
      action: () => this.openAddGameModal(),
    },
    {
      label: 'Nearby Teams',
      icon: 'search-outline',
      color: 'secondary',
      action: () => this.findNearbyTeams(),
    },
    {
      label: 'Tournaments',
      icon: 'trophy-outline',
      color: 'tertiary',
      action: () => this.findTournaments(),
    },
  ];
  constructor() {
    addIcons({ addOutline, peopleOutline, trophyOutline, searchOutline });
  }

  openAddGameModal(): void {
    this.addGameModalService.openModal();
  }

  findNearbyTeams(): void {
    this.router.navigate(['/app/opponents'], { queryParams: { from: 'schedule' } });
  }

  findTournaments(): void {
    this.router.navigate(['/app/tournaments'], { queryParams: { from: 'schedule' } });
  }
}
