import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessagesService } from '@hockey-team-scheduler/shared-data-access';
import { ConversationDisplay } from '@hockey-team-scheduler/shared-utilities';
import { of } from 'rxjs';
import { ConversationsComponent } from './conversations.component';

describe('ConversationsComponent', () => {
  let component: ConversationsComponent;
  let fixture: ComponentFixture<ConversationsComponent>;
  let mockMessagesService: jest.Mocked<Partial<MessagesService>>;
  let mockRouter: jest.Mocked<Partial<Router>>;

  const mockConversations: ConversationDisplay[] = [
    {
      id: 'conv-1',
      name: 'John Doe',
      lastMessage: 'Hey, want to schedule a game?',
      timestamp: '2024-01-15T10:30:00Z',
      unreadCount: 2,
      avatar: 'https://example.com/avatar1.jpg',
    },
    {
      id: 'conv-2',
      name: 'Jane Smith',
      lastMessage: 'Thanks for the game!',
      timestamp: '2024-01-14T15:45:00Z',
      unreadCount: 0,
      avatar: 'https://example.com/avatar2.jpg',
    },
  ];

  beforeEach(async () => {
    mockMessagesService = {
      getConversations: jest.fn().mockReturnValue(of(mockConversations)),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConversationsComponent, ReactiveFormsModule],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should have form with search control', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('search')).toBeTruthy();
    });

    it('should initialize with empty conversations signal', () => {
      expect(component.conversations()).toEqual([]);
    });

    it('should initialize with empty filtered signal', () => {
      expect(component.filtered()).toEqual([]);
    });

    it('should initialize newMessageCount as 0', () => {
      expect(component.newMessageCount()).toBe(0);
    });

    it('should have label set to Search', () => {
      expect(component.label).toBe('Search');
    });
  });

  describe('loadConversations', () => {
    it('should call getConversations after init', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockMessagesService.getConversations).toHaveBeenCalled();
    });
  });

  describe('findNearbyTeams', () => {
    it('should navigate to opponents page', () => {
      component.findNearbyTeams();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/opponents']);
    });
  });

  describe('getFormControl', () => {
    it('should return the search form control', () => {
      const control = component.getFormControl(component.form, 'search');

      expect(control).toBe(component.form.get('search'));
    });
  });
});
