import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MessagesService } from '@hockey-team-scheduler/shared-data-access';
import { Message } from '@hockey-team-scheduler/shared-utilities';
import { of, Subject } from 'rxjs';
import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let mockMessagesService: jest.Mocked<Partial<MessagesService>>;
  let paramsSubject: Subject<{ id: string }>;

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      sender: 'user',
      content: 'Hello, are you available for a game?',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'msg-2',
      sender: 'manager',
      content: 'Yes, what time works for you?',
      createdAt: '2024-01-15T10:05:00Z',
    },
  ];

  beforeEach(async () => {
    paramsSubject = new Subject<{ id: string }>();

    mockMessagesService = {
      getMessages: jest.fn().mockReturnValue(of(mockMessages)),
      sendMessage: jest.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with empty conversationId', () => {
      expect(component.conversationId()).toBe('');
    });

    it('should initialize with default managerName', () => {
      expect(component.managerName()).toBe('Manager Name');
    });

    it('should initialize with aiEnabled as true', () => {
      expect(component.aiEnabled()).toBe(true);
    });

    it('should initialize with empty messages array', () => {
      expect(component.messages()).toEqual([]);
    });

    it('should initialize with isSending as false', () => {
      expect(component.isSending()).toBe(false);
    });

    it('should have chatSummaries defined', () => {
      expect(component.chatSummaries).toBeDefined();
      expect(component.chatSummaries.length).toBe(3);
    });
  });

  describe('ngOnInit - route params subscription', () => {
    it('should set conversationId from route params', fakeAsync(() => {
      fixture.detectChanges();

      paramsSubject.next({ id: 'conv-123' });
      tick();

      expect(component.conversationId()).toBe('conv-123');
    }));

    it('should load messages when conversationId changes', fakeAsync(() => {
      fixture.detectChanges();

      paramsSubject.next({ id: 'conv-123' });
      tick();

      expect(mockMessagesService.getMessages).toHaveBeenCalledWith('conv-123');
    }));

    it('should update messages signal with loaded messages', fakeAsync(() => {
      fixture.detectChanges();

      paramsSubject.next({ id: 'conv-123' });
      tick();

      expect(component.messages()).toEqual(mockMessages);
    }));
  });

  describe('loadMessages', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      paramsSubject.next({ id: 'conv-123' });
      tick();
    }));

    it('should not load messages when conversationId is empty', () => {
      component.conversationId.set('');
      mockMessagesService.getMessages?.mockClear();

      component.loadMessages();

      expect(mockMessagesService.getMessages).not.toHaveBeenCalled();
    });
  });

  describe('onMessageSent', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      paramsSubject.next({ id: 'conv-123' });
      tick();
      mockMessagesService.getMessages?.mockClear();
    }));

    it('should not send message if already sending', () => {
      component.isSending.set(true);

      component.onMessageSent('Hello');

      expect(mockMessagesService.sendMessage).not.toHaveBeenCalled();
    });

    it('should call messagesService.sendMessage with correct params', () => {
      component.onMessageSent('Test message');

      expect(mockMessagesService.sendMessage).toHaveBeenCalledWith(
        'conv-123',
        'Test message'
      );
    });

    it('should reload messages after successful send', fakeAsync(() => {
      component.onMessageSent('Test message');
      tick();

      // getMessages should be called to reload messages
      expect(mockMessagesService.getMessages).toHaveBeenCalledWith('conv-123');
    }));

    it('should set isSending to false after successful send', fakeAsync(() => {
      component.onMessageSent('Test message');
      tick();

      expect(component.isSending()).toBe(false);
    }));
  });

  describe('chatSummaries', () => {
    it('should have Agent Details summary', () => {
      const agentDetails = component.chatSummaries.find(
        (s) => s.title === 'Agent Details'
      );

      expect(agentDetails).toBeDefined();
      expect(agentDetails?.content.length).toBeGreaterThan(0);
    });

    it('should have Manager Details summary', () => {
      const managerDetails = component.chatSummaries.find(
        (s) => s.title === 'Manager Details'
      );

      expect(managerDetails).toBeDefined();
      expect(managerDetails?.content.length).toBeGreaterThan(0);
    });

    it('should have Conversation Details summary', () => {
      const convDetails = component.chatSummaries.find(
        (s) => s.title === 'Conversation Details'
      );

      expect(convDetails).toBeDefined();
      expect(convDetails?.content.length).toBeGreaterThan(0);
    });
  });
});
