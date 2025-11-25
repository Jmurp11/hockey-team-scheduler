/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseClient: any;

  beforeEach(async () => {
    mockSupabaseClient = {
      auth: {
        exchangeCodeForSession: jasmine.createSpy('exchangeCodeForSession'),
        getSession: jasmine.createSpy('getSession'),
      },
    };

    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getSupabaseClient',
    ]);
    mockSupabaseService.getSupabaseClient.and.returnValue(mockSupabaseClient);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading message', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading p').textContent).toContain(
      'Signing you in...'
    );
  });

  it('should have centered container', () => {
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.callback-container');
    expect(container).toBeTruthy();
  });
});
