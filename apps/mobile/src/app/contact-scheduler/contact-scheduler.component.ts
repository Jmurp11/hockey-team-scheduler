import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ContactHeaderComponent } from './contact-header/contact-header.component';
import { ContactContentComponent } from './contact-content/contact-content.component';
import { ContactSchedulerDialogService } from './contact-scheduler.service';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
} from '@ionic/angular/standalone';
import { LoadingComponent } from '../shared/loading/loading.component';
import { ButtonComponent } from '../shared/button/button.component';

@Component({
  selector: 'app-contact-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    ButtonComponent,
    IonContent,
    LoadingComponent,
    ContactContentComponent,
    ContactHeaderComponent,
  ],
  template: `
    <ion-modal
      [isOpen]="contactSchedulerDialogService.isOpen()"
      (didDismiss)="cancel()"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ 'Manager Details' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="cancel()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <div class="container">
            @if (manager) {
              <app-contact-header [manager]="manager" />
              <app-contact-content [manager]="manager" />
            } @else {
              <ng-template #loading>
                <app-loading></app-loading>
              </ng-template>
            }
          </div>
        </ion-content>

        <div class="bottom-button-container">
          <app-button
            [expand]="'block'"
            [color]="'secondary'"
            (onClick)="cancel()"
          >
            Cancel
          </app-button>
        </div>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;
      .container {
        @include flex(flex-start, center, column);
        width: 100%;
        height: auto;
        padding: 2rem 0rem;
        gap: 2rem;
        text-align: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSchedulerComponent {
  contactSchedulerDialogService = inject(ContactSchedulerDialogService);

  manager = this.contactSchedulerDialogService.managerData();

  cancel() {
    this.contactSchedulerDialogService.closeModal();
  }
}
