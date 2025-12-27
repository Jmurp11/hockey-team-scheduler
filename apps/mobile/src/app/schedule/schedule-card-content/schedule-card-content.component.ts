import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-schedule-card-content',
  standalone: true,
  imports: [CommonModule, IonItem, IonList, IonLabel, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-list>
      @for (item of items; track item.label) {
        <ion-item lines="none">
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
    addIcons({ locationOutline, homeOutline });
  }
}
