import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon, IonItem, IonLabel, IonList } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-schedule-card-content',
  standalone: true,
  imports: [CommonModule, IonItem, IonList, IonLabel, IonIcon],
  template: `
    <ion-list>
      @for (item of items; track item.label) {
        <ion-item>
          <ion-icon slot="start" [name]="item.icon" />
          <ion-label class="detail-label">{{ item.label }}</ion-label>
        </ion-item>
      }
    </ion-list>
  `,
  styles: ``,
})
export class ScheduleCardContentComponent {
  @Input() items!: any[];

  constructor() {
    addIcons({ locationOutline, timeOutline });
  }
}
