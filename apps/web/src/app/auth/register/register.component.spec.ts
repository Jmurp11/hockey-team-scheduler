import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG, AssociationsService } from '@hockey-team-scheduler/shared-data-access';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAssociationsService: jest.Mocked<AssociationsService>;

  beforeEach(async () => {
    mockAssociationsService = {
      getAssociations: jest.fn().mockReturnValue(of([])),
      associations: jest.fn().mockReturnValue(of([])),
    } as any;

    const mockHttpClient = {
      get: jest.fn().mockReturnValue(of([])),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: APP_CONFIG, useValue: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'test-key', apiUrl: 'https://test-api.com' } },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: AssociationsService, useValue: mockAssociationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
