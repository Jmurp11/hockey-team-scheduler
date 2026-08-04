import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-ai-consent-dialog',
  standalone: true,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
  ],
  template: `
    <ion-modal [isOpen]="isOpen()" [backdropDismiss]="false">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>AI Data Sharing Consent</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div class="consent-content">
            <p class="consent-intro">
              RinkLinkGPT uses AI to help you manage your hockey team. Before
              using this feature, please review how your data is handled.
            </p>

            <h3>What data is shared</h3>
            <ul>
              <li>Your team name, schedule, and location</li>
              <li>Contact information (name, email)</li>
              <li>Conversation messages you send in the chat</li>
            </ul>

            <h3>Who receives your data</h3>
            <p>
              Your data is sent to <strong>OpenAI</strong> (GPT-4) for
              processing. OpenAI's data usage policies apply.
            </p>

            <h3>Purpose</h3>
            <ul>
              <li>Scheduling assistance and game matching</li>
              <li>Email drafting to other team managers</li>
              <li>Tournament and team search</li>
            </ul>

            <p class="consent-privacy">
              For more information, see our
              <a href="https://rinklink.com/privacy" target="_blank" rel="noopener">
                Privacy Policy</a>.
            </p>

            <div class="consent-actions">
              <ion-button
                expand="block"
                color="medium"
                fill="outline"
                (click)="declined.emit()"
              >
                Decline
              </ion-button>
              <ion-button
                expand="block"
                color="primary"
                (click)="accepted.emit()"
              >
                I Agree
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      .consent-content {
        max-width: 500px;
        margin: 0 auto;
      }

      .consent-intro {
        font-size: 1rem;
        line-height: 1.5;
        margin-bottom: 1.25rem;
      }

      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 1rem 0 0.5rem;
      }

      ul {
        padding-left: 1.25rem;
        margin: 0 0 0.75rem;

        li {
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
      }

      .consent-privacy {
        margin-top: 1rem;
        font-size: 0.875rem;

        a {
          color: var(--ion-color-primary);
          text-decoration: underline;
        }
      }

      .consent-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiConsentDialogComponent {
  isOpen = input(false);
  accepted = output();
  declined = output();
}
