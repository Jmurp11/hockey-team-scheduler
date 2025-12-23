import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, createOutline, trashOutline } from 'ionicons/icons';
import { ButtonComponent } from '../../shared/button/button.component';
import { AddGameModalService } from '../add-game/add-game-modal.service';
import { ScheduleService } from '@hockey-team-scheduler/shared-data-access';
import { take } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-schedule-card-footer',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="footer-content">
    @for (button of buttons; track button.label) {
      <app-button
        [color]="button.color"
        (click)="button.action(game)"
        [fill]="'outline'"
        [size]="'default'"
      >
        <ion-icon
          slot="icon-only"
          [name]="button.icon"
          [color]="button.color"
        />
      </app-button>
    }
  </div>`,
  styles: [
    `
      @use 'mixins/flex' as *;

      .footer-content {
        @include flex(space-between, center, row);
      }
    `,
  ],
})
export class ScheduleCardFooterComponent {
  @Input() game: any;

  private addGameModalService = inject(AddGameModalService);
  private scheduleService = inject(ScheduleService);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({ createOutline, trashOutline, chatbubbleOutline });
  }
  buttons = [
    {
      label: 'Contact',
      action: this.contact.bind(this),
      color: 'primary',
      icon: 'chatbubble-outline',
    },
    {
      label: 'Edit',
      action: this.edit.bind(this),
      color: 'secondary',
      icon: 'create-outline',
    },
    {
      label: 'Delete',
      action: this.delete.bind(this),
      color: 'danger',
      icon: 'trash-outline',
    },
  ];

  edit(game: any) {
    const gameData = {
      ...game,
      opponent: { label: game.opponent[0].name, value: game.opponent[0] },
      rink: { label: game.rink, value: game.rink },
    };
    this.addGameModalService.openModal(gameData, true);
  }

  delete(game: any) {
    this.scheduleService.setDeleteRecord(game.id);
    this.scheduleService
      .deleteGame(game.id)
      .pipe(take(1))
      .subscribe((response) => {
        return response && response.error
          ? this.toastService.presentErrorToast(
              'Error deleting game. Please try again.',
            )
          : this.toastService.presentSuccessToast('Game deleted successfully.');
      });
  }

  contact(game: any) {
    console.log({ game });
  }
}
