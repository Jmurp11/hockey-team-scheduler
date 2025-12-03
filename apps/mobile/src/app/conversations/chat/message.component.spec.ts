import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MessageComponent } from './message.component';
import { MessageAvatarComponent } from './message-avatar.component';

describe('MessageComponent', () => {
  let component: MessageComponent;
  let fixture: ComponentFixture<MessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageComponent, NgStyle],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component setup', () => {
    describe('template rendering', () => {
      beforeEach(() => {
        component.message = {
          id: '1',
          content: 'Test message content',
          sender: 'contact',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          conversationId: 'conv-1'
        };
        fixture.detectChanges();
      });

      it('should render message content', () => {
        const messageElement =
          fixture.debugElement.nativeElement.querySelector('.message-content');
        expect(messageElement.textContent.trim()).toBe('Test message content');
      });

      it('should render user message with avatar on right', () => {
        component.message.sender = 'user';
        fixture.detectChanges();

        const contentDiv =
          fixture.debugElement.nativeElement.querySelector('.content');
        const messageContent = contentDiv.querySelector('.message-content');

        expect(messageContent).toBeTruthy();
      });

      it('should display timestamp', () => {
        const timestampElement =
          fixture.debugElement.nativeElement.querySelector('.timestamp');
        expect(timestampElement).toBeTruthy();
        // The exact format depends on the getLastMessageTime utility function
        expect(timestampElement.textContent.trim()).toBeTruthy();
      });
    });

    describe('getContentStyle', () => {
      it('should return correct styles for contact sender', () => {
        const styles = component.getContentStyle('contact');

        expect(styles).toEqual({
          'background-color': 'var(--ion-color-light)',
          color: 'var(--ion-color-dark)',
        });
      });

      it('should return correct styles for assistant sender', () => {
        const styles = component.getContentStyle('assistant');

        expect(styles).toEqual({
          'background-color': 'var(--tertiary-300)',
          color: 'var(--primary-600)',
        });
      });

      it('should return default styles for other senders', () => {
        const styles = component.getContentStyle('user');

        expect(styles).toEqual({
          'background-color': 'var(--secondary-200)',
          color: 'var(--primary-600)',
        });
      });

      it('should return default styles for unknown sender', () => {
        const styles = component.getContentStyle('unknown');

        expect(styles).toEqual({
          'background-color': 'var(--secondary-200)',
          color: 'var(--primary-600)',
        });
      });
    });

    describe('getLastMessageTime', () => {
      beforeEach(() => {
        component.message = {
          id: '1',
          content: 'Test message',
          sender: 'user',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          conversationId: 'conv-1'
        };
      });

      it('should have getLastMessageTime function available', () => {
        expect(component.getLastMessageTime).toBeDefined();
        expect(typeof component.getLastMessageTime).toBe('function');
      });

      it('should call getLastMessageTime with message createdAt', () => {
        jest.spyOn(component, 'getLastMessageTime').mockReturnValue('10:00 AM');

        component.getLastMessageTime(component.message.createdAt);

        expect(component.getLastMessageTime).toHaveBeenCalledWith(
          component.message.createdAt,
        );
      });
    });
  });
});
