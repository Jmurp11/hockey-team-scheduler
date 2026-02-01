import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

import {
  AgentContextService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  AgentInvocationContext,
  DisplayMessage,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';

import { ContactHeaderComponent } from './contact-header/contact-header.component';
import { ContactContentComponent } from './contact-content/contact-content.component';
import { ContactSchedulerDialogService } from './contact-scheduler.service';
import { AiEmailPanelComponent } from './ai-email-panel/ai-email-panel.component';
import { LoadingComponent } from '../shared/loading/loading.component';
import { ButtonComponent } from '../shared/button/button.component';
import { ToastService } from '../shared/toast/toast.service';

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
    IonContent,
    IonIcon,
    ButtonComponent,
    LoadingComponent,
    ContactContentComponent,
    ContactHeaderComponent,
    AiEmailPanelComponent,
  ],
  template: `
    <ion-modal
      [isOpen]="contactSchedulerDialogService.isOpen()"
      (didDismiss)="cancel()"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            @if (aiPanelOpen()) {
              <ion-buttons slot="start">
                <ion-button color="secondary" (click)="closeAiPanel()">
                  <ion-icon slot="icon-only" name="arrow-back-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
              <ion-title>AI Email Assistant</ion-title>
            } @else {
              <ion-title>Manager Details</ion-title>
            }
            <ion-buttons slot="end">
              <ion-button color="secondary" (click)="cancel()">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <div class="container">
            @if (manager) {
              @if (!aiPanelOpen()) {
                <!-- Standard contact info view -->
                <app-contact-header [manager]="manager" />
                <app-contact-content [manager]="manager" />

                <!-- AI Email Button -->
                @if (userId()) {
                  <div class="ai-button-container">
                    <app-button
                      [expand]="'block'"
                      [color]="'primary'"
                      [fill]="'outline'"
                      [disabled]="!manager?.email"
                      (onClick)="openAiPanel()"
                    >
                      <i class="bi bi-robot" style="margin-right: 8px;"></i>
                      Use AI to Send Email
                    </app-button>
                  </div>
                }
              } @else {
                <!-- AI Email Panel -->
                <app-ai-email-panel
                  [contact]="getContactFromManager()"
                  [userId]="userId()!"
                  [sourceTeamName]="userTeamName() ?? undefined"
                  (emailSent)="onEmailSent()"
                  (openFullChat)="onOpenFullChat($event)"
                  (cancel)="closeAiPanel()"
                />
              }
            } @else {
              <app-loading></app-loading>
            }
          </div>
        </ion-content>

        @if (!aiPanelOpen()) {
          <div class="bottom-button-container">
            <app-button
              [expand]="'block'"
              [color]="'secondary'"
              (onClick)="cancel()"
            >
              Cancel
            </app-button>
          </div>
        }
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

      .ai-button-container {
        width: 100%;
        padding: 0 2rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSchedulerComponent implements OnInit {
  private authService = inject(AuthService);
  private agentContextService = inject(AgentContextService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  contactSchedulerDialogService = inject(ContactSchedulerDialogService);

  private user$ = toObservable(this.authService.currentUser);

  manager = this.contactSchedulerDialogService.managerData();

  // State
  userId = signal<string | null>(null);
  userTeamName = signal<string | null>(null);
  aiPanelOpen = signal(false);

  constructor() {
    addIcons({ arrowBackOutline });
  }

  ngOnInit(): void {
    this.initializeUserSubscription();
  }

  /**
   * Open the AI email panel.
   */
  openAiPanel(): void {
    this.aiPanelOpen.set(true);
  }

  /**
   * Close the AI email panel.
   */
  closeAiPanel(): void {
    this.aiPanelOpen.set(false);
  }

  /**
   * Handle email sent event from AI panel.
   */
  onEmailSent(): void {
    this.toastService.presentToast(
      `Your email to ${this.manager?.name} has been sent successfully.`,
      3000,
      'bottom',
      'success'
    );

    // Close the modal after a brief delay
    setTimeout(() => {
      this.cancel();
    }, 1500);
  }

  /**
   * Handle navigation to full chat.
   */
  onOpenFullChat(event: {
    context: AgentInvocationContext;
    messages: DisplayMessage[];
  }): void {
    // Store context for restoration in the full chat view
    this.agentContextService.prepareForFullChat(
      event.context,
      event.messages,
      this.router.url
    );

    // Close the modal
    this.contactSchedulerDialogService.closeModal();

    // Navigate to full chat
    this.router.navigate(['/app/rinklink-gpt']);
  }

  /**
   * Close the modal.
   */
  cancel(): void {
    this.aiPanelOpen.set(false);
    this.contactSchedulerDialogService.closeModal();
  }

  /**
   * Get contact info from the manager for the AI panel.
   */
  getContactFromManager(): AgentInvocationContext['contact'] {
    return {
      name: this.manager?.name || '',
      email: this.manager?.email || '',
      phone: this.manager?.phone || '',
      team: this.manager?.team || '',
    };
  }

  /**
   * Initialize the user subscription to get the user ID.
   */
  private initializeUserSubscription(): void {
    this.user$
      .pipe(
        filter((user): user is UserProfile => !!user?.user_id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((user) => {
        this.userId.set(user.user_id);
        this.userTeamName.set(user.team_name || null);
      });
  }
}
