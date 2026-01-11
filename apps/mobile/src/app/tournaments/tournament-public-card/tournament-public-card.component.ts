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
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  compassOutline,
  locationOutline,
  mailOutline,
  star,
  trophyOutline,
} from 'ionicons/icons';
import { ButtonComponent } from '../../shared/button/button.component';

/**
 * Tournament card component for mobile public listing.
 * Displays tournament info with special styling for featured tournaments.
 *
 * When showAuthenticatedFeatures is true (used in /app/tournaments for logged-in users),
 * displays distance information and an "Add to Schedule" button.
 */
@Component({
  selector: 'app-tournament-public-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonChip,
    ButtonComponent,
  ],
  template: `
    <ion-card
      class="tournament-card"
      [class.featured]="tournament.featured"
    >
      <!-- Featured Badge -->
      @if (tournament.featured) {
        <div class="featured-badge">
          <ion-icon name="star"></ion-icon>
          <span>Featured</span>
        </div>
      }

      <ion-card-header>
        <div class="header-row">
          <ion-card-title class="tournament-name" [class.featured]="tournament.featured">
            {{ tournament.name }}
          </ion-card-title>
          <!-- Distance indicator for authenticated users -->
          @if (showAuthenticatedFeatures && tournament.distance !== undefined) {
            <div class="distance-badge">
              <ion-icon name="compass-outline"></ion-icon>
              <span>{{ formatDistance(tournament.distance) }}</span>
            </div>
          }
        </div>
        <ion-card-subtitle>
          <div class="meta-item">
            <ion-icon name="location-outline"></ion-icon>
            <span>{{ formatLocation(tournament.location) }}</span>
          </div>
          <div class="meta-item">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>
              {{ tournament.startDate | date: 'MMM d' }} -
              {{ tournament.endDate | date: 'MMM d, y' }}
            </span>
          </div>
        </ion-card-subtitle>
      </ion-card-header>

      <ion-card-content>
        @if (tournament.description) {
          <p class="description">{{ tournament.description }}</p>
        }

        <div class="details-grid">
          @if (tournament.age?.length || tournament.ages?.length) {
            <div class="detail-item">
              <span class="detail-label">Age Groups</span>
              <div class="chip-list">
                @for (age of getAges(); track age) {
                  <ion-chip color="primary" class="small-chip">{{ age }}</ion-chip>
                }
              </div>
            </div>
          }

          @if (tournament.level?.length || tournament.levels?.length) {
            <div class="detail-item">
              <span class="detail-label">Levels</span>
              <div class="chip-list">
                @for (level of getLevels(); track level) {
                  <ion-chip color="primary" class="small-chip">{{ level }}</ion-chip>
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

        <!-- Card Footer -->
        <div class="card-footer" [class.multi-button]="showAuthenticatedFeatures">
          @if (tournament.registrationUrl) {
            <app-button
              [fill]="tournament.featured ? 'solid' : 'outline'"
              [color]="tournament.featured ? 'primary' : 'secondary'"
              [size]="'small'"
              [expand]="showAuthenticatedFeatures ? 'block' : undefined"
              (onClick)="onRegister()"
            >
              <ion-icon name="trophy-outline" slot="start"></ion-icon>
              Register
            </app-button>
          } @else {
            <app-button
              [fill]="'outline'"
              [color]="'secondary'"
              [size]="'small'"
              [expand]="showAuthenticatedFeatures ? 'block' : undefined"
              (onClick)="onContact()"
            >
              <ion-icon name="mail-outline" slot="start"></ion-icon>
              Contact
            </app-button>
          }

          <!-- Add to Schedule button for authenticated users -->
          @if (showAuthenticatedFeatures) {
            <app-button
              [fill]="'outline'"
              [color]="'secondary'"
              [size]="'small'"
              [expand]="'block'"
              (onClick)="onAddToSchedule()"
            >
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Add
            </app-button>
          }
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .tournament-card {
        position: relative;
        margin: 0 0 1rem 0;
        transition: all 0.3s ease;

        // Featured tournament styling
        &.featured {
          background: linear-gradient(
            135deg,
            var(--secondary-100, #e0e7ff) 0%,
            white 100%
          );
          border: 1px solid var(--ion-color-secondary-shade, #c7d2fe);
          box-shadow:
            0 4px 8px rgba(var(--ion-color-secondary-rgb), 0.1),
            0 12px 24px rgba(var(--ion-color-secondary-rgb), 0.15);
        }
      }

      // Featured badge
      .featured-badge {
        position: absolute;
        top: 2.5px;
        right: 16px;
        @include flex(center, center, row);
        gap: 0.25rem;
        background: linear-gradient(135deg, #facc15 0%, #fb923c 100%);
        color: white;
        padding: 0.25rem 0.6rem;
        border-radius: 16px;
        font-size: 0.65rem;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        z-index: 1;

        ion-icon {
          font-size: 0.6rem;
        }
      }

      // Header row with name and distance
      .header-row {
        @include flex(space-between, flex-start, row);
        gap: 0.5rem;
        width: 100%;
      }

      .tournament-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--ion-color-dark);
        flex: 1;
        line-height: 1.3;

        &.featured {
          color: var(--ion-color-primary-shade, #1d4ed8);
        }
      }

      // Distance badge for authenticated users
      .distance-badge {
        @include flex(center, center, row);
        gap: 0.25rem;
        background: var(--ion-color-light);
        color: var(--ion-color-medium);
        padding: 0.25rem 0.6rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
        flex-shrink: 0;

        ion-icon {
          font-size: 0.65rem;
          color: var(--ion-color-primary);
        }
      }

      ion-card-subtitle {
        margin-top: 0.5rem;
      }

      .meta-item {
        @include flex(flex-start, center, row);
        gap: 0.35rem;
        font-size: 0.8rem;
        color: var(--ion-color-medium);
        margin-bottom: 0.25rem;

        ion-icon {
          font-size: 0.75rem;
          color: var(--ion-color-primary);
        }
      }

      // Card content
      .description {
        font-size: 0.85rem;
        color: var(--ion-color-medium);
        line-height: 1.5;
        margin: 0 0 0.75rem 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .details-grid {
        @include flex(flex-start, stretch, column);
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .detail-item {
        @include flex(flex-start, flex-start, column);
        gap: 0.25rem;
      }

      .detail-label {
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        font-size: 0.8rem;
        color: var(--ion-color-dark);
      }

      .chip-list {
        @include flex(flex-start, center, row);
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .small-chip {
        font-size: 0.6rem;
        height: 20px;
        padding: 0 0.5rem;
      }

      // Card footer
      .card-footer {
        @include flex(flex-end, center, row);
        padding-top: 0.75rem;
        border-top: 1px solid var(--ion-color-light);

        // Multi-button layout for authenticated mode
        // Buttons are equally spaced and each takes 50% width
        &.multi-button {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          width: 100%;

          app-button {
            flex: 1 1 0;
            width: 50%;
            min-width: 0;
          }
        }
      }
    `,
  ],
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

  formatLocation = formatTournamentLocation;

  constructor() {
    addIcons({
      star,
      locationOutline,
      calendarOutline,
      compassOutline,
      trophyOutline,
      mailOutline,
      addOutline,
    });
  }

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

  onRegister(): void {
    this.registerClick.emit(this.tournament);
  }

  onContact(): void {
    this.contactClick.emit(this.tournament);
  }

  onAddToSchedule(): void {
    this.addToScheduleClick.emit(this.tournament);
  }
}
