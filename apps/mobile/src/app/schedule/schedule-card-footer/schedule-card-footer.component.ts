import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, createOutline, trashOutline } from 'ionicons/icons';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-schedule-card-footer',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IonIcon],
  template: `<div class="footer-content">
    @for (button of buttons; track button.label) {
      <app-button
        [color]="button.color"
        (click)="button.action(game)"
        [fill]="'clear'"
      >
        <ion-icon slot="icon-only" [name]="button.icon" [color]="button.color" />
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

  constructor() {
    addIcons({ createOutline, trashOutline, chatbubbleOutline });
  }
  buttons = [
        {
      label: 'Contact',
      action: this.contact.bind(this),
      color: 'secondary',
      icon: 'chatbubble-outline',
    },
    {
      label: 'Edit',
      action: this.edit.bind(this),
      color: 'warning',
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
    console.log({ game });
  }

  delete(game: any) {
    console.log({ game });
  }

  contact(game: any) {
    console.log({ game });
  }
}
