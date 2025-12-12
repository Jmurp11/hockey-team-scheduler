import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { CardComponent } from '../shared/components/card/card.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-developer',
  template: ` <div class="api-title">Developer</div>

    <div class="container">
      @for (card of cards; track card.title) {
        <app-card>
          <ng-template #title>
            <div class="title_row">
              <i
                [class]="card.icon"
                style="font-size: 2rem; color: var(--primary-500)"
              ></i>
              <h3>{{ card.title }}</h3>
              <span></span></div
          ></ng-template>
          <ng-template #content>
            <p>{{ card.description }}</p>
          </ng-template>
          <ng-template #footer>
            <p-button
              label="{{ card.button.text }}"
              (onClick)="card.button.action()"
              variant="outlined"
              size="large"
            />
          </ng-template>
        </app-card>
      }
    </div>`,
  styles: [
    `
      @use 'mixins/mixins' as *;
      .container {
        width: 100%;
        height: 65%;
        @include flex(space-evenly, center, column);
      }

      .api-title {
        padding: 1rem 4rem 0rem;
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 16px;
        color: var(--primary-500);
      }

      .title_row {
        @include flex(space-between, center, row);
        gap: 12px;
      }

      app-card {
        font-size: 16px;
        width: 80vw;
        height: 40vh;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        padding: 1rem;

        ::ng-deep .p-card-body {
          max-height: 40vh;
        }
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeveloperComponent {
  private router = inject(Router);

  cards = [
    {
      icon: 'pi pi-fw pi-bolt',
      title: 'Quick Start Guide',
      description: `RinkLink.ai API is accessible through our Pay-Per-Request plan, meaning you only pay for exactly what you consume. Our pricing is competitive and affordable, making it easy for developers of all sizes to access our powerful youth hockey data.To get started with RinkLink.ai, you'll need an API key.  Once you have your key, you can authenticate your requests by including it in the x-api-key header of your HTTP requests.`,
      button: {
        text: 'Get API Keys',
        action: () => {
          this.router.navigate(['/pricing']);
        },
      },
    },
    {
      icon: 'pi pi-fw pi-folder-open',
      title: 'API Reference',
      description: `Now that you have your API key, you can start exploring our API endpoints. Our comprehensive API documentation provides detailed information on each endpoint, including request and response formats, parameters, and example usage.`,
      button: {
        text: 'View Docs',
        action: () => {
          this.navigate();
        },
      },
    },
  ];

  navigate() {
    const stripVersion = environment.apiUrl.replace('/v1', '');
    window.location.href = `${stripVersion}/api/docs`;
  }
}
