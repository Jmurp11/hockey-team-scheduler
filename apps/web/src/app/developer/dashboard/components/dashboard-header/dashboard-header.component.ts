import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
import { ApiUserPublic } from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-developer-dashboard-header',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Developer Dashboard</h1>
        @if (user) {
          <p class="email">{{ user.email }}</p>
        }
      </div>
      <div class="header-actions">
        <p-button
          label="View Docs"
          icon="pi pi-book"
          variant="outlined"
          (onClick)="onViewDocs()"
        />
        <p-button
          label="Logout"
          icon="pi pi-sign-out"
          severity="secondary"
          variant="text"
          (onClick)="onLogout()"
        />
      </div>
    </header>
  `,
  styleUrl: './dashboard-header.component.scss',
})
export class DeveloperDashboardHeaderComponent {
  @Input() user: ApiUserPublic | null = null;
  @Output() logout = new EventEmitter<void>();
  @Output() viewDocs = new EventEmitter<void>();

  onLogout(): void {
    this.logout.emit();
  }

  onViewDocs(): void {
    this.viewDocs.emit();
  }
}
