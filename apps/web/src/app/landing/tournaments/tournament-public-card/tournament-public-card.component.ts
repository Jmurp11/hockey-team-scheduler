import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  formatTournamentLocation,
  Tournament,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

/**
 * Tournament card component for public listing.
 * Displays tournament info with special styling for featured tournaments.
 *
 * When showAuthenticatedFeatures is true (used in /app/tournaments for logged-in users),
 * displays distance information and an "Add to Schedule" button.
 */
@Component({
  selector: 'app-tournament-public-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  template: `
    <div
      class="tournament-card"
      [class.featured]="tournament.featured"
      [class.expanded]="isExpanded"
      [class.authenticated-mode]="showAuthenticatedFeatures"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (focus)="onFocus()"
      (blur)="onBlur()"
      tabindex="0"
    >
      <!-- Featured Badge -->
      @if (tournament.featured) {
        <div class="featured-badge">
          <i class="pi pi-star-fill"></i>
          <span>Featured</span>
        </div>
      }

      <!-- Card Header -->
      <div class="card-header">
        <div class="header-row">
          <h3 class="tournament-name">{{ tournament.name }}</h3>
          <!-- Distance indicator for authenticated users -->
          @if (showAuthenticatedFeatures && tournament.distance !== undefined) {
            <div class="distance-badge">
              <i class="pi pi-compass"></i>
              <span>{{ formatDistance(tournament.distance) }}</span>
            </div>
          }
        </div>
        <div class="tournament-meta">
          <div class="meta-item">
            <i class="pi pi-map-marker"></i>
            <span>{{ formatLocation(tournament.location) }}</span>
          </div>
          <div class="meta-item">
            <i class="pi pi-calendar"></i>
            <span>
              {{ tournament.startDate | date: 'MMM d' }} -
              {{ tournament.endDate | date: 'MMM d, y' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Card Content -->
      <div class="card-content">
        @if (tournament.description) {
          <p class="description" [class.expanded]="isExpanded">
            {{ tournament.description }}
          </p>
        }

        <div class="details-grid">
          @if (tournament.age?.length || tournament.ages?.length) {
            <div class="detail-item">
              <span class="detail-label">Age Groups</span>
              <div class="tag-list">
                @for (age of getAges(); track age) {
                  <p-tag [value]="age" severity="info" [rounded]="true" />
                }
              </div>
            </div>
          }

          @if (tournament.level?.length || tournament.levels?.length) {
            <div class="detail-item">
              <span class="detail-label">Levels</span>
              <div class="tag-list">
                @for (level of getLevels(); track level) {
                  <p-tag [value]="level" severity="secondary" [rounded]="true" />
                }
              </div>
            </div>
          }

          @if (tournament.rink) {
            <div class="detail-item">
              <span class="detail-label">Venue</span>
              <span class="detail-value">{{ tournament.rink }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Card Footer -->
      <div class="card-footer" [class.multi-button]="showAuthenticatedFeatures">
        @if (tournament.registrationUrl) {
          <p-button
            label="Register"
            icon="pi pi-trophy"
            iconPos="right"
            [outlined]="!tournament.featured"
            (click)="onRegister($event)"
          />
        } @else {
          <p-button
            label="Contact"
            icon="pi pi-envelope"
            severity="secondary"
            [outlined]="true"
            (click)="onContact($event)"
          />
        }

        <!-- Add to Schedule button for authenticated users -->
        @if (showAuthenticatedFeatures) {
          <p-button
            label="Add"
            icon="pi pi-plus"
            iconPos="right"
            [outlined]="true"
            (click)="onAddToSchedule($event)"
          />
        }
      </div>
    </div>
  `,
  styleUrls: ['./tournament-public-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentPublicCardComponent {
  @Input({ required: true }) tournament!: Tournament;

  /**
   * When true, shows authenticated-only features like distance and "Add to Schedule" button.
   * Used when the card is rendered in /app/tournaments for logged-in users.
   */
  @Input() showAuthenticatedFeatures = false;

  @Output() registerClick = new EventEmitter<Tournament>();
  @Output() contactClick = new EventEmitter<Tournament>();
  @Output() addToScheduleClick = new EventEmitter<Tournament>();

  isExpanded = false;

  formatLocation = formatTournamentLocation;

  /**
   * Formats distance in miles for display.
   */
  formatDistance(distance: number | undefined): string {
    if (distance === undefined) return 'N/A';
    return `${distance.toFixed(1)} mi`;
  }

  /**
   * Returns a flattened array of age groups from the tournament data.
   * Handles various data formats: arrays, nested arrays, and comma-separated strings.
   */
  getAges(): string[] {
    const ages = this.tournament.ages || this.tournament.age || [];
    return this.flattenArrayData(ages);
  }

  /**
   * Returns a flattened array of levels from the tournament data.
   * Handles various data formats: arrays, nested arrays, and comma-separated strings.
   */
  getLevels(): string[] {
    const levels = this.tournament.levels || this.tournament.level || [];
    return this.flattenArrayData(levels);
  }

  /**
   * Flattens array data that may come in various formats from different API endpoints.
   * Handles: regular arrays, nested arrays [[...]], and comma-separated strings.
   */
  private flattenArrayData(data: unknown): string[] {
    if (!data) return [];

    // If it's already a flat array of strings
    if (Array.isArray(data)) {
      // Check if it's a nested array like [["10U", "12U"]]
      if (data.length > 0 && Array.isArray(data[0])) {
        // Flatten nested arrays
        return data.flat().filter((item): item is string => typeof item === 'string');
      }
      // Regular array - filter to strings only
      return data.filter((item): item is string => typeof item === 'string');
    }

    // If it's a comma-separated string
    if (typeof data === 'string') {
      return data.split(',').map((s) => s.trim()).filter(Boolean);
    }

    return [];
  }

  onMouseEnter(): void {
    this.isExpanded = true;
  }

  onMouseLeave(): void {
    this.isExpanded = false;
  }

  onFocus(): void {
    this.isExpanded = true;
  }

  onBlur(): void {
    this.isExpanded = false;
  }

  onRegister(event: Event): void {
    event.stopPropagation();
    this.registerClick.emit(this.tournament);
  }

  onContact(event: Event): void {
    event.stopPropagation();
    this.contactClick.emit(this.tournament);
  }

  onAddToSchedule(event: Event): void {
    event.stopPropagation();
    this.addToScheduleClick.emit(this.tournament);
  }
}
