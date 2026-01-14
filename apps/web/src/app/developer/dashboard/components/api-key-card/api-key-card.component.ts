import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
} from '@angular/core';
import { ApiKeyDisplay } from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-api-key-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card class="api-key-card">
      <ng-template #title>
        <div class="card-header">
          <i class="pi pi-key"></i>
          <h3>Your API Key</h3>
        </div>
      </ng-template>
      <ng-template #content>
        <div class="api-key-display">
          @if (newApiKey()) {
            <!-- Show new key after rotation -->
            <div class="new-key-alert">
              <i class="pi pi-exclamation-triangle"></i>
              <p>
                <strong>Save this key now!</strong> It won't be shown again.
              </p>
            </div>
            <div class="key-value full-key">
              <code>{{ newApiKey() }}</code>
              <p-button
                icon="pi pi-copy"
                variant="text"
                (onClick)="onCopyKey(newApiKey()!)"
                pTooltip="Copy to clipboard"
              />
            </div>
            <p-button
              label="I've saved my key"
              size="small"
              (onClick)="onClearNewKey()"
            />
          } @else {
            <!-- Show masked key -->
            <div class="key-value">
              <code>{{ apiKey?.key || '****' }}</code>
            </div>
            @if (apiKey?.lastUsed) {
              <p class="last-used">
                Last used: {{ formatDate(apiKey?.lastUsed) }}
              </p>
            }
          }
        </div>
      </ng-template>
      <ng-template #footer>
        <p-button
          label="Rotate Key"
          icon="pi pi-refresh"
          severity="warn"
          variant="outlined"
          [loading]="rotatingKey"
          (onClick)="onRotateKey()"
        />
      </ng-template>
    </app-card>
  `,
  styleUrl: './api-key-card.component.scss',
})
export class ApiKeyCardComponent {
  @Input() apiKey: ApiKeyDisplay | null = null;
  @Input() rotatingKey = false;
  @Output() rotateKey = new EventEmitter<void>();
  @Output() clearNewKey = new EventEmitter<void>();
  @Output() copyKey = new EventEmitter<string>();

  newApiKey = signal<string | null>(null);

  setNewApiKey(key: string): void {
    this.newApiKey.set(key);
  }

  onRotateKey(): void {
    this.rotateKey.emit();
  }

  onClearNewKey(): void {
    this.newApiKey.set(null);
    this.clearNewKey.emit();
  }

  onCopyKey(key: string): void {
    this.copyKey.emit(key);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
