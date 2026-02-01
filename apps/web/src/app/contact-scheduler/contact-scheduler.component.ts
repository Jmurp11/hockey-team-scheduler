import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter } from 'rxjs';

import {
  AgentContextService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  AiEmailPanelComponent,
} from '@hockey-team-scheduler/shared-ui';
import {
  AgentInvocationContext,
  DisplayMessage,
  Manager,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';

import { ContactHeaderComponent } from './contact-header/contact-header.component';
import { ContactContentComponent } from './contact-content/contact-content.component';
import { DialogComponent } from '../shared/components/dialog/dialog.component';
import { ContactSchedulerDialogService } from './contact-scheduler.service';
import { ToastService } from '../shared/services/toast.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contact-scheduler',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    ContactHeaderComponent,
    ContactContentComponent,
    DialogComponent,
    ProgressSpinner,
    AiEmailPanelComponent,
  ],
  template: `
    @if (manager) {
      <app-dialog [visible]="contactSchedulerDialogService.isVisible()">
        <ng-template #header>
          <div class="dialog-header">
            <span><h2>Manager Details</h2></span>
          </div>
        </ng-template>

        <div class="container">
          <app-contact-header [manager]="manager" />

          @if (!aiPanelOpen()) {
            <!-- Standard contact info view -->
            <app-contact-content [manager]="manager" />

            <!-- AI Email Button -->
            @if (userId()) {
              <div class="ai-button-container">
                <p-button
                  label="Use AI to Send Email"
                  icon="bi bi-robot"
                  [disabled]="!manager.email"
                  (click)="openAiPanel()"
                />
              </div>
            }
          } @else {
            <!-- AI Email Panel -->
            <div class="ai-panel-container">
              <lib-ai-email-panel
                [contact]="getContactFromManager()"
                [userId]="userId()!"
                [sourceTeamName]="userTeamName() ?? undefined"
                (emailSent)="onEmailSent()"
                (openFullChat)="onOpenFullChat($event)"
                (cancel)="closeAiPanel()"
              />
            </div>
          }
        </div>

        <ng-template #footer>
          @if (aiPanelOpen()) {
            <p-button
              label="Back to Contact Info"
              icon="pi pi-arrow-left"
              [text]="true"
              severity="secondary"
              (click)="closeAiPanel()"
            />
          } @else {
            <p-button
              label="Cancel"
              [text]="true"
              severity="secondary"
              (click)="cancel()"
            />
          }
        </ng-template>
      </app-dialog>
    } @else {
      <div class="loading-spinner">
        <p-progressSpinner />
      </div>
    }
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .container {
        @include flex(flex-start, center, column);
        width: 100%;
        height: auto;
        padding: 2rem 0rem;
        gap: 1rem;
        text-align: center;
      }

      .ai-button-container {
        margin-top: 1rem;
        padding: 0 2rem;
        width: 100%;

        ::ng-deep .p-button {
          width: 100%;
          justify-content: center;

          .bi-robot {
            margin-right: 0.5rem;
          }
        }
      }

      .ai-panel-container {
        width: 100%;
        padding: 0 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSchedulerComponent implements OnInit {
  @Input()
  manager: Manager;

  private authService = inject(AuthService);
  private agentContextService = inject(AgentContextService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  contactSchedulerDialogService = inject(ContactSchedulerDialogService);

  private user$ = toObservable(this.authService.currentUser);

  // State
  userId = signal<string | null>(null);
  userTeamName = signal<string | null>(null);
  aiPanelOpen = signal(false);

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
    this.toastService.presentToast({
      severity: 'success',
      summary: 'Email Sent',
      detail: `Your email to ${this.manager.name} has been sent successfully.`,
    });

    // Close the dialog after a brief delay
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

    // Close the dialog
    this.contactSchedulerDialogService.closeDialog();

    // Navigate to full chat
    this.router.navigate(['/app/rinklink-gpt']);
  }

  /**
   * Close the dialog.
   */
  cancel(): void {
    this.aiPanelOpen.set(false);
    this.contactSchedulerDialogService.closeDialog();
  }

  /**
   * Get contact info from the manager for the AI panel.
   */
  getContactFromManager(): AgentInvocationContext['contact'] {
    return {
      name: this.manager.name,
      email: this.manager.email,
      phone: this.manager.phone,
      team: this.manager.team,
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
