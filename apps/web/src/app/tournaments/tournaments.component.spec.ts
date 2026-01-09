import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_CONFIG, AuthService, TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import { Tournament, UserProfile } from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { TournamentsComponent } from './tournaments.component';

describe('TournamentsComponent', () => {
  let component: TournamentsComponent;
  let fixture: ComponentFixture<TournamentsComponent>;
  let mockAuthService: any;
  let mockTournamentsService: any;

  const mockTournaments: Tournament[] = [
    {
      id: 1,
      name: 'Spring Championship',
      location: 'Boston, MA',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      distance: 10,
      featured: true,
      registrationUrl: 'https://example.com/register',
      division: '14U',
      rink: 'Boston Arena',
    },
    {
      id: 2,
      name: 'Summer Classic',
      location: 'New York, NY',
      startDate: '2024-06-20',
      endDate: '2024-06-22',
      distance: 25,
      featured: false,
      registrationUrl: 'https://example.com/register2',
      division: '14U',
      rink: 'NYC Rink',
    },
  ];

  const mockUser: UserProfile = {
    id: 'user-1',
    team_id: 1,
    association_id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    user_id: 'user-1',
  };

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal(mockUser),
    };

    mockTournamentsService = {
      nearByTournaments: jest.fn().mockReturnValue(of(mockTournaments)),
    };

    await TestBed.configureTestingModule({
      imports: [TournamentsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        { provide: APP_CONFIG, useValue: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'test-key', apiUrl: 'https://test-api.com' } },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TournamentsService, useValue: mockTournamentsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with loading state as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have sort fields defined with correct values', () => {
      expect(component.sortFields).toBeDefined();
      expect(component.sortFields.length).toBe(2);
      expect(component.sortFields).toContainEqual({ label: 'Distance', value: 'distance' });
      expect(component.sortFields).toContainEqual({ label: 'Date', value: 'startDate' });
    });

    it('should have filter options defined with correct values', () => {
      expect(component.filterOptions).toBeDefined();
      expect(component.filterOptions.length).toBe(2);
      expect(component.filterOptions).toContainEqual({ label: 'All Tournaments', value: 'all' });
      expect(component.filterOptions).toContainEqual({ label: 'Featured Only', value: 'featured' });
    });

    it('should initialize filterControl with default value of all', () => {
      expect(component.filterControl.value).toBe('all');
    });

    it('should have filterControl as FormControl instance', () => {
      expect(component.filterControl).toBeInstanceOf(FormControl);
    });
  });

  describe('ngOnInit', () => {
    it('should set up tournaments$ observable', () => {
      fixture.detectChanges();
      expect(component.tournaments$).toBeDefined();
    });

    it('should set up nearbyTournaments$ observable', () => {
      fixture.detectChanges();
      expect(component.nearbyTournaments$).toBeDefined();
    });
  });

  describe('onSortChanged', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not throw when called with valid sort event', () => {
      const sortEvent = { field: 'startDate', sortDirection: 'desc' as const };
      expect(() => component.onSortChanged(sortEvent)).not.toThrow();
    });

    it('should accept asc sort direction', () => {
      const sortEvent = { field: 'distance', sortDirection: 'asc' as const };
      expect(() => component.onSortChanged(sortEvent)).not.toThrow();
    });

    it('should accept desc sort direction', () => {
      const sortEvent = { field: 'distance', sortDirection: 'desc' as const };
      expect(() => component.onSortChanged(sortEvent)).not.toThrow();
    });
  });

  describe('onSearchChanged', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not throw when called with search term', () => {
      expect(() => component.onSearchChanged('Boston')).not.toThrow();
    });

    it('should not throw when called with empty search term', () => {
      expect(() => component.onSearchChanged('')).not.toThrow();
    });

    it('should not throw when called with null search term', () => {
      expect(() => component.onSearchChanged(null)).not.toThrow();
    });
  });

  describe('authService and tournamentsService', () => {
    it('should have authService injected', () => {
      expect(component.authService).toBeDefined();
    });

    it('should have tournamentsService injected', () => {
      expect(component.tournamentsService).toBeDefined();
    });
  });

  describe('user$ observable', () => {
    it('should be defined', () => {
      expect(component.user$).toBeDefined();
    });
  });

  describe('getNearbyTournaments', () => {
    it('should return an observable', () => {
      fixture.detectChanges();
      const result = component.getNearbyTournaments();
      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });
  });
});
