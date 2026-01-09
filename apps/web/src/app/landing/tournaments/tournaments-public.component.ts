import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import {
  sortTournamentsWithFeaturedFirst,
  Tournament,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { debounceTime, startWith } from 'rxjs';
import { CardComponent } from '../../shared/components/card/card.component';
import { TournamentPublicCardComponent } from './tournament-public-card/tournament-public-card.component';
import { SeoService } from '../../shared/services/seo.service';

type FilterOption = 'all' | 'featured';

interface FilterButtonOption {
  label: string;
  value: FilterOption;
}

/**
 * Public tournaments listing page.
 * Displays all upcoming tournaments with featured tournaments highlighted.
 * Accessible without authentication.
 */
@Component({
  selector: 'app-tournaments-public',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    CardComponent,
    TournamentPublicCardComponent,
  ],
  template: `
    <main class="tournaments-public-container">
      <header class="hero-section">
        <h1>Find Your Next Tournament</h1>
        <p class="subtitle">
          Discover youth hockey tournaments across the country
        </p>
      </header>

      <section class="content-section">
        <!-- Search and Filter Controls -->
        <div class="filter-controls">
          <p-selectButton
            [options]="filterOptions"
            [(ngModel)]="selectedFilter"
            optionLabel="label"
            optionValue="value"
            (onChange)="onFilterChange()"
          />

          <!-- Search using PrimeNG IconField component -->
          <p-iconfield class="search-field">
            <p-inputicon class="pi pi-search" />
            <input
              type="text"
              pInputText
              [formControl]="searchControl"
              placeholder="Search tournaments..."
              class="search-input"
            />
            @if (searchControl.value) {
              <p-inputicon
                class="pi pi-times clear-icon"
                (click)="clearSearch()"
              />
            }
          </p-iconfield>

          <p-button
            label="List Your Tournament"
            icon="pi pi-plus"
            (click)="navigateToSubmit()"
          />
        </div>

        <!-- Results count -->
        <div class="results-info">
          <span class="results-count">
            {{ filteredTournaments().length }} tournament{{
              filteredTournaments().length !== 1 ? 's' : ''
            }}
            found
          </span>
          @if (searchQuery()) {
            <span class="search-badge"
              >searching for "{{ searchQuery() }}"</span
            >
          }
          @if (selectedFilter() === 'featured') {
            <span class="filter-badge">Showing featured only</span>
          }
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-container">
            <p-progressSpinner
              strokeWidth="4"
              [style]="{ width: '50px', height: '50px' }"
            />
            <p>Loading tournaments...</p>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <app-card class="error-card">
            <ng-template #content>
              <div class="error-content">
                <i class="pi pi-exclamation-triangle error-icon"></i>
                <p>{{ error() }}</p>
                <p-button
                  label="Try Again"
                  icon="pi pi-refresh"
                  (click)="loadTournaments()"
                />
              </div>
            </ng-template>
          </app-card>
        }

        <!-- Empty State -->
        @if (!isLoading() && !error() && filteredTournaments().length === 0) {
          <app-card class="empty-card">
            <ng-template #content>
              <div class="empty-content">
                <i class="pi pi-calendar empty-icon"></i>
                @if (selectedFilter() === 'featured') {
                  <p>No featured tournaments found.</p>
                  <p-button
                    label="Show All Tournaments"
                    (click)="selectedFilter.set('all')"
                  />
                } @else {
                  <p>No upcoming tournaments found.</p>
                  <p>Be the first to list your tournament!</p>
                  <p-button
                    label="List Your Tournament"
                    icon="pi pi-plus"
                    (click)="navigateToSubmit()"
                  />
                }
              </div>
            </ng-template>
          </app-card>
        }

        <!-- Tournament Grid -->
        @if (!isLoading() && !error() && filteredTournaments().length > 0) {
          <div class="tournaments-grid">
            @for (tournament of filteredTournaments(); track tournament.id) {
              <app-tournament-public-card
                [tournament]="tournament"
                (registerClick)="onRegisterClick($event)"
              />
            }
          </div>
        }
      </section>

      <!-- CTA Section -->
      <aside class="cta-section">
        <h2>Are You a Tournament Director?</h2>
        <p>
          Get your tournament in front of thousands of hockey teams. Featured
          listings get priority placement and promotional benefits.
        </p>
        <div class="cta-buttons">
          <p-button
            label="List for Free"
            severity="secondary"
            (click)="navigateToSubmit()"
          />
          <p-button
            label="Get Featured - $99"
            icon="pi pi-star"
            (click)="navigateToSubmit()"
          />
        </div>
      </aside>
    </main>
  `,
  styleUrls: ['./tournaments-public.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsPublicComponent implements OnInit {
  private tournamentsService = inject(TournamentsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private seoService = inject(SeoService);

  // State
  tournaments = signal<Tournament[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedFilter = signal<FilterOption>('all');

  // Search form control with debounced signal
  searchControl = new FormControl<string>('');
  searchQuery = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
    ),
    { initialValue: '' },
  );

  // Filter options for SelectButton
  filterOptions: FilterButtonOption[] = [
    { label: 'All Tournaments', value: 'all' },
    { label: 'Featured', value: 'featured' },
  ];

  /**
   * Computed filtered and sorted list.
   * Applies search filter, featured filter, and featured-first sorting.
   */
  filteredTournaments = computed(() => {
    let results = this.tournaments();
    const query = (this.searchQuery() || '').toLowerCase().trim();
    const filter = this.selectedFilter();

    // Apply search filter
    if (query) {
      results = results.filter((t) => this.matchesSearch(t, query));
    }

    // Apply featured filter
    if (filter === 'featured') {
      results = results.filter((t) => t.featured);
    }

    // Sort with featured tournaments first
    return sortTournamentsWithFeaturedFirst(results, 'startDate', 'asc');
  });

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Find Youth Hockey Tournaments - RinkLink.ai Tournament Directory',
      description:
        'Browse upcoming youth hockey tournaments across North America. Find the perfect tournament for your team with filters by location, date, and skill level. Register today!',
      url: 'https://rinklink.ai/tournaments',
      keywords:
        'youth hockey tournaments, hockey tournament directory, find hockey tournaments, register hockey tournament, hockey events',
    });

    this.loadTournaments();
  }

  loadTournaments(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.tournamentsService
      .publicTournaments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tournaments) => {
          this.tournaments.set(tournaments);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading tournaments:', err);
          this.error.set('Failed to load tournaments. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange(): void {
    // Filter is reactive via computed, no additional action needed
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  onRegisterClick(tournament: Tournament): void {
    if (tournament.registrationUrl) {
      window.open(tournament.registrationUrl, '_blank');
    }
  }

  navigateToSubmit(): void {
    this.router.navigate(['/tournament-director']);
  }

  /**
   * Checks if a tournament matches the search query.
   * Searches across name, location, ages, levels, and description.
   */
  private matchesSearch(tournament: Tournament, query: string): boolean {
    // Check name
    if (tournament.name.toLowerCase().includes(query)) {
      return true;
    }

    // Check location
    if (tournament.location.toLowerCase().includes(query)) {
      return true;
    }

    // Check rink
    if (tournament.rink?.toLowerCase().includes(query)) {
      return true;
    }

    // Check description
    if (tournament.description?.toLowerCase().includes(query)) {
      return true;
    }

    // Check ages
    const ages = tournament.ages || tournament.age || [];
    if (ages.some((age) => age.toLowerCase().includes(query))) {
      return true;
    }

    // Check levels
    const levels = tournament.levels || tournament.level || [];
    if (levels.some((level) => level.toLowerCase().includes(query))) {
      return true;
    }

    return false;
  }
}
