import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationService } from '@hockey-team-scheduler/shared-ui';
import { MenuItem } from 'primeng/api';
import { HeaderComponent } from './header.component';

// Mock window.matchMedia for PrimeNG components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockNavigationService: jest.Mocked<Partial<NavigationService>>;

  beforeEach(async () => {
    mockNavigationService = {
      navigateToLink: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: NavigationService, useValue: mockNavigationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('input properties', () => {
    it('should accept menu items', () => {
      const menuItems: MenuItem[] = [
        { label: 'Home', routerLink: '/home' },
        { label: 'About', routerLink: '/about' },
      ];

      component.items = menuItems;

      expect(component.items).toEqual(menuItems);
    });

    it('should accept custom class', () => {
      component.class = 'custom-header-class';

      expect(component.class).toBe('custom-header-class');
    });

    it('should default showHamburger to false', () => {
      expect(component.showHamburger).toBe(false);
    });

    it('should accept showHamburger input', () => {
      component.showHamburger = true;

      expect(component.showHamburger).toBe(true);
    });
  });

  describe('hamburger menu', () => {
    it('should emit hamburgerClick when onHamburgerClick is called', () => {
      const emitSpy = jest.spyOn(component.hamburgerClick, 'emit');

      component.onHamburgerClick();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('navigation service', () => {
    it('should expose navigation service for template usage', () => {
      expect(component.navigation).toBeDefined();
    });
  });

  describe('content projection', () => {
    it('should have start template reference initially undefined', () => {
      // ContentChild is undefined until content is projected
      expect(component.start).toBeUndefined();
    });

    it('should have end template reference initially undefined', () => {
      // ContentChild is undefined until content is projected
      expect(component.end).toBeUndefined();
    });
  });
});
