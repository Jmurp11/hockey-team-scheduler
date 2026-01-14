import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-quick-start-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card class="quickstart-card">
      <ng-template #title>
        <div class="card-header">
          <i class="pi pi-bolt"></i>
          <h3>Quick Start</h3>
        </div>
      </ng-template>
      <ng-template #content>
        <div class="code-example">
          <p>Include your API key in the x-api-key header:</p>
          <pre><code>curl -H "x-api-key: YOUR_API_KEY" \\
  {{ apiBaseUrl }}/tournaments</code></pre>
        </div>
      </ng-template>
      <ng-template #footer>
        <p-button
          label="View Full Documentation"
          icon="pi pi-external-link"
          variant="text"
          (onClick)="onViewDocs()"
        />
      </ng-template>
    </app-card>
  `,
  styleUrl: './quick-start-card.component.scss',
})
export class QuickStartCardComponent {
  @Input() apiBaseUrl = '';

  onViewDocs(): void {
    const stripVersion = this.apiBaseUrl.replace('/v1', '');
    window.location.href = `${stripVersion}/api/docs`;
  }
}
