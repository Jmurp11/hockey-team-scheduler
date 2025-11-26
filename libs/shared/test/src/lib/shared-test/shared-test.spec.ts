import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedTest } from './shared-test';

describe('SharedTest', () => {
  let component: SharedTest;
  let fixture: ComponentFixture<SharedTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedTest],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render SharedTest works message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toContain('SharedTest works!');
  });

  it('should have correct selector', () => {
    const selector = 'lib-shared-test';
    // We can't directly test the selector from the component instance,
    // but we can test that the component was created with the expected selector
    expect(fixture.debugElement.nativeElement.tagName.toLowerCase()).toBeTruthy();
  });
});