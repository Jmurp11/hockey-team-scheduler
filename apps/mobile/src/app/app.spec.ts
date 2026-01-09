import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, signal, Component } from '@angular/core';
import { AuthService, UserService } from '@hockey-team-scheduler/shared-data-access';
import { App } from './app';

/**
 * Tests for App (Root Component)
 *
 * This component is the root of the mobile application.
 * Key behaviors tested:
 * - Component creation
 * - Menu items configuration
 * - Admin menu filtering based on user role
 * - Logout functionality
 *
 * Note: We test the component class behavior directly where possible
 * to avoid complexity with Ionic's router outlet and menu components.
 */
describe('App', () => {
  let authServiceMock: {
    currentUser: ReturnType<typeof signal>;
  };
  let userServiceMock: {
    logout: jest.Mock;
  };
  let routerMock: {
    navigate: jest.Mock;
    events: { subscribe: jest.Mock };
    routerState: { root: {} };
  };

  beforeEach(async () => {
    // Create mock with a writable signal for currentUser
    authServiceMock = {
      currentUser: signal<{ role?: string } | null>(null),
    };

    userServiceMock = {
      logout: jest.fn().mockResolvedValue(undefined),
    };

    // Provide a more complete router mock to satisfy Angular's router requirements
    routerMock = {
      navigate: jest.fn().mockResolvedValue(true),
      events: { subscribe: jest.fn() },
      routerState: { root: {} },
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(App, {
        set: {
          // Override template to avoid router outlet issues
          template: '<div></div>',
        },
      })
      .compileComponents();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  describe('menu items', () => {
    it('should have menuItems as a computed signal', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      expect(app.menuItems).toBeDefined();
      expect(typeof app.menuItems).toBe('function');
    });

    it('should return menu items array', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      const items = app.menuItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should include Dashboard menu item', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const dashboardItem = items.find((item) => item.title === 'Dashboard');

      expect(dashboardItem).toBeDefined();
      expect(dashboardItem?.url).toBe('/app/dashboard');
      expect(dashboardItem?.icon).toBe('bar-chart');
    });

    it('should include Schedule menu item', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const scheduleItem = items.find((item) => item.title === 'Schedule');

      expect(scheduleItem).toBeDefined();
      expect(scheduleItem?.url).toBe('/app/schedule');
      expect(scheduleItem?.icon).toBe('calendar');
    });

    it('should include Profile menu item', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const profileItem = items.find((item) => item.title === 'Profile');

      expect(profileItem).toBeDefined();
      expect(profileItem?.url).toBe('/app/profile');
    });

    it('should include Tournaments menu item', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const tournamentsItem = items.find((item) => item.title === 'Tournaments');

      expect(tournamentsItem).toBeDefined();
      expect(tournamentsItem?.url).toBe('/app/tournaments');
    });

    it('should include Opponents menu item', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const opponentsItem = items.find((item) => item.title === 'Opponents');

      expect(opponentsItem).toBeDefined();
      expect(opponentsItem?.url).toBe('/app/opponents');
    });
  });

  describe('admin menu filtering', () => {
    it('should NOT include Admin menu item for non-admin users', () => {
      authServiceMock.currentUser.set({ role: 'USER' });

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const adminItem = items.find((item) => item.title === 'Admin');

      expect(adminItem).toBeUndefined();
    });

    it('should NOT include Admin menu item when user is null', () => {
      authServiceMock.currentUser.set(null);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const adminItem = items.find((item) => item.title === 'Admin');

      expect(adminItem).toBeUndefined();
    });

    it('should include Admin menu item for admin users', () => {
      authServiceMock.currentUser.set({ role: 'ADMIN' });

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      const items = app.menuItems();
      const adminItem = items.find((item) => item.title === 'Admin');

      expect(adminItem).toBeDefined();
      expect(adminItem?.url).toBe('/app/admin');
      expect(adminItem?.icon).toBe('cog');
    });

    it('should dynamically update menu items when user role changes', () => {
      authServiceMock.currentUser.set({ role: 'USER' });

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      // Initially no admin
      let items = app.menuItems();
      expect(items.find((item) => item.title === 'Admin')).toBeUndefined();

      // Update to admin
      authServiceMock.currentUser.set({ role: 'ADMIN' });
      fixture.detectChanges();

      // Now admin should be visible
      items = app.menuItems();
      expect(items.find((item) => item.title === 'Admin')).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should call userService.logout when logout is invoked', async () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      await app.logout();

      expect(userServiceMock.logout).toHaveBeenCalled();
    });

    it('should navigate to login page after successful logout', async () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      await app.logout();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should handle logout errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      userServiceMock.logout.mockRejectedValue(new Error('Logout failed'));

      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      await app.logout();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not navigate when logout fails', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      userServiceMock.logout.mockRejectedValue(new Error('Logout failed'));

      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      await app.logout();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });
});
