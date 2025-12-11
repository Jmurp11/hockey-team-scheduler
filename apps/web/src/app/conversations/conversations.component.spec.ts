import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@hockey-team-scheduler/shared-data-access';
import { ConversationsComponent } from './conversations.component';

describe('ConversationsComponent', () => {
  let component: ConversationsComponent;
  let fixture: ComponentFixture<ConversationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationsComponent],
      providers: [
        provideHttpClient(),
        {
          provide: APP_CONFIG,
          useValue: {
            apiUrl: 'http://localhost:3000',
            supabaseUrl: 'http://localhost:54321',
            supabaseAnonKey: 'test-key',
            appName: 'web'
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
