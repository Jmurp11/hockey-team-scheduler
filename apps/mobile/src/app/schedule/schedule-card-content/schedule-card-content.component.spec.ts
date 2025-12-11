import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonIcon, IonItem, IonLabel, IonList, IonNote } from '@ionic/angular/standalone';
import { ScheduleCardContentComponent } from './schedule-card-content.component';

describe('ScheduleCardContentComponent', () => {
  let component: ScheduleCardContentComponent;
  let fixture: ComponentFixture<ScheduleCardContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScheduleCardContentComponent,
        IonItem,
        IonList,
        IonLabel,
        IonIcon,
        IonNote,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleCardContentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render items correctly', () => {
    const mockItems = [
      { label: 'Test Location', icon: 'locationOutline' },
      { label: 'Test Time', icon: 'timeOutline' },
      { label: 'Game Location', icon: 'locationOutline', isHome: true },
    ];

    component.items = mockItems;
    fixture.detectChanges();

    const ionItems = fixture.debugElement.nativeElement.querySelectorAll('ion-item');
    expect(ionItems.length).toBe(3);

    const labels = fixture.debugElement.nativeElement.querySelectorAll('ion-label');
    expect(labels[0].textContent.trim()).toBe('Test Location');
    expect(labels[1].textContent.trim()).toBe('Test Time');
    expect(labels[2].textContent.trim()).toBe('Game Location');
  });

  describe('isHome method', () => {
    it('should return "Home" when isHome is true', () => {
      expect(component.isHome(true)).toBe('Home');
    });

    it('should return "Away" when isHome is false', () => {
      expect(component.isHome(false)).toBe('Away');
    });
  });

  describe('hasIsHome method', () => {
    it('should return true when item has isHome property', () => {
      const item = { label: 'Test', isHome: true };
      expect(component.hasIsHome(item)).toBe(true);
    });

    it('should return true when item has isHome property set to false', () => {
      const item = { label: 'Test', isHome: false };
      expect(component.hasIsHome(item)).toBe(true);
    });

    it('should return false when item does not have isHome property', () => {
      const item = { label: 'Test' };
      expect(component.hasIsHome(item)).toBe(false);
    });

    it('should return false when item is null or undefined', () => {
      expect(component.hasIsHome(null)).toBeFalsy();
      expect(component.hasIsHome(undefined)).toBeFalsy();
    });
  });

  it('should display Home/Away note when item has isHome property', () => {
    const mockItems = [
      { label: 'Home Game', icon: 'locationOutline', isHome: true },
      { label: 'Away Game', icon: 'locationOutline', isHome: false },
      { label: 'Regular Item', icon: 'timeOutline' },
    ];

    component.items = mockItems;
    fixture.detectChanges();

    const ionNotes = fixture.debugElement.nativeElement.querySelectorAll('ion-note');
    expect(ionNotes.length).toBe(2); // Only items with isHome property should have notes
    expect(ionNotes[0].textContent.trim()).toBe('Home');
    expect(ionNotes[1].textContent.trim()).toBe('Away');
  });
});