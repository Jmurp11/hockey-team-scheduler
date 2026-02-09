import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { BugReportStateService } from '@hockey-team-scheduler/shared-data-access';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonMenuButton,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-bug-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Report a Bug</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Report a Bug</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <form [formGroup]="bugReportState.form" (ngSubmit)="submit()">
            <ion-input
              label="Email"
              labelPlacement="floating"
              type="email"
              formControlName="email"
              class="ion-margin-bottom"
            />
            <ion-input
              label="Subject"
              labelPlacement="floating"
              formControlName="subject"
              class="ion-margin-bottom"
            />
            <ion-textarea
              label="Describe the bug"
              labelPlacement="floating"
              formControlName="message"
              [autoGrow]="true"
              [rows]="4"
              class="ion-margin-bottom"
            />
            <ion-button
              expand="block"
              type="submit"
              color="secondary"
              [disabled]="bugReportState.form.invalid || bugReportState.loading()"
            >
              @if (bugReportState.loading()) {
                <ion-spinner name="crescent" />
              } @else {
                Submit Bug Report
              }
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      ion-card {
        max-width: 600px;
        margin: 0 auto;
      }

      ion-input,
      ion-textarea {
        margin-bottom: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BugReportPage implements OnDestroy {
  protected bugReportState = inject(BugReportStateService);
  private toastController = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  submit(): void {
    const result$ = this.bugReportState.submit();
    if (!result$) return;

    result$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.showToast('Bug report sent. Thank you!', 'success'),
      error: () =>
        this.showToast(
          'Failed to send bug report. Please try again later.',
          'danger',
        ),
    });
  }

  ngOnDestroy(): void {
    this.bugReportState.reset();
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
