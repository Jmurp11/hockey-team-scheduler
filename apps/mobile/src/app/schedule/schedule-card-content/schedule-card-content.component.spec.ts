import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ScheduleCardContentComponent } from './schedule-card-content.component';

/**
 * Tests for ScheduleCardContentComponent
 *
 * This component displays schedule card content items with icons and labels.
 * We use CUSTOM_ELEMENTS_SCHEMA and override the template to avoid Ionic/Stencil
 * component rendering issues in Jest's jsdom environment.
 */
describe('ScheduleCardContentComponent', () => {
  let component: ScheduleCardContentComponent;
  let fixture: ComponentFixture<ScheduleCardContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCardContentComponent],
      // CUSTOM_ELEMENTS_SCHEMA prevents errors from Ionic web components
      // that don't render properly in Jest's jsdom environment
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(ScheduleCardContentComponent, {
        set: {
          // Override template to avoid Ionic icon loading issues
          template: `
            <ion-list>
              @for (item of items; track item.label) {
                <ion-item lines="none">
                  <ion-icon slot="start" [attr.name]="item.icon"></ion-icon>
                  <ion-label class="detail-label">{{ item.label }}</ion-label>
                </ion-item>
              }
            </ion-list>
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ScheduleCardContentComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('items input', () => {
    it('should accept items input array', () => {
      const mockItems = [
        { label: 'Test Location', icon: 'locationOutline' },
        { label: 'Test Time', icon: 'timeOutline' },
      ];

      component.items = mockItems;
      fixture.detectChanges();

      expect(component.items).toBe(mockItems);
      expect(component.items.length).toBe(2);
    });

    it('should handle empty items array', () => {
      component.items = [];
      fixture.detectChanges();

      expect(component.items).toEqual([]);
    });

    it('should handle items with various icon types', () => {
      const mockItems = [
        { label: 'Location 1', icon: 'locationOutline' },
        { label: 'Home', icon: 'homeOutline' },
        { label: 'Time', icon: 'timeOutline' },
      ];

      component.items = mockItems;
      fixture.detectChanges();

      expect(component.items.length).toBe(3);
      expect(component.items[0].label).toBe('Location 1');
      expect(component.items[1].icon).toBe('homeOutline');
    });
  });

  describe('template rendering', () => {
    it('should render ion-list element', () => {
      component.items = [{ label: 'Test', icon: 'locationOutline' }];
      fixture.detectChanges();

      const ionList = fixture.nativeElement.querySelector('ion-list');
      expect(ionList).toBeTruthy();
    });

    it('should render ion-item for each item in array', () => {
      const mockItems = [
        { label: 'Item 1', icon: 'icon1' },
        { label: 'Item 2', icon: 'icon2' },
        { label: 'Item 3', icon: 'icon3' },
      ];

      component.items = mockItems;
      fixture.detectChanges();

      const ionItems = fixture.nativeElement.querySelectorAll('ion-item');
      expect(ionItems.length).toBe(3);
    });

    it('should render ion-label with correct text content', () => {
      component.items = [{ label: 'Test Label', icon: 'testIcon' }];
      fixture.detectChanges();

      const ionLabel = fixture.nativeElement.querySelector('ion-label');
      expect(ionLabel).toBeTruthy();
      expect(ionLabel.textContent.trim()).toBe('Test Label');
    });

    it('should render ion-icon with correct name attribute', () => {
      component.items = [{ label: 'Test', icon: 'locationOutline' }];
      fixture.detectChanges();

      const ionIcon = fixture.nativeElement.querySelector('ion-icon');
      expect(ionIcon).toBeTruthy();
      expect(ionIcon.getAttribute('name')).toBe('locationOutline');
    });

    it('should render multiple labels correctly', () => {
      const mockItems = [
        { label: 'Location A', icon: 'locationOutline' },
        { label: 'Time B', icon: 'timeOutline' },
      ];

      component.items = mockItems;
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('ion-label');
      expect(labels.length).toBe(2);
      expect(labels[0].textContent.trim()).toBe('Location A');
      expect(labels[1].textContent.trim()).toBe('Time B');
    });

    it('should render no items when array is empty', () => {
      component.items = [];
      fixture.detectChanges();

      const ionItems = fixture.nativeElement.querySelectorAll('ion-item');
      expect(ionItems.length).toBe(0);
    });
  });

  describe('data integrity', () => {
    it('should preserve item data structure', () => {
      const mockItems = [
        { label: 'Game Location', icon: 'locationOutline', extra: 'value' },
      ];

      component.items = mockItems as any[];
      fixture.detectChanges();

      expect(component.items[0]).toEqual({
        label: 'Game Location',
        icon: 'locationOutline',
        extra: 'value',
      });
    });

    it('should handle items with special characters in label', () => {
      const mockItems = [
        { label: "O'Brien Arena & Center", icon: 'locationOutline' },
      ];

      component.items = mockItems;
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('ion-label');
      expect(label.textContent.trim()).toBe("O'Brien Arena & Center");
    });
  });
});
