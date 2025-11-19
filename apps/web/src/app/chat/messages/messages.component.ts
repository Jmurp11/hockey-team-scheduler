import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Message } from '../../shared/types/message.type';
import { MessageComponent } from './message/message.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [NgClass, MessageComponent],
  template: `
    <div class="messages">
      @for (message of messages; track message.id) {
      <div
        class="messages__message"
        [ngClass]="getMessageClass(message.sender)"
      >
        <app-message [message]="message" />
      </div>
      }
    </div>
  `,
  styleUrls: ['./messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent {
  @Input() messages: Message[] = [
    {
      id: '1',
      sender: 'contact',
      content:
        'Hey coach! Just wanted to confirm the practice time for tomorrow.',
      createdAt: '2025-10-29T10:30:00Z',
    },
    {
      id: '2',
      sender: 'user',
      content:
        "Practice is at 6:00 PM at the main rink. Don't forget your gear!",
      createdAt: '2025-10-29T10:35:00Z',
    },
    {
      id: '3',
      sender: 'contact',
      content: 'Perfect, thanks! Should I bring extra pucks?',
      createdAt: '2025-10-29T10:36:00Z',
    },
    {
      id: '4',
      sender: 'assistant',
      content:
        'Based on the team inventory, you currently have 12 pucks available. For a practice session with 15 players, I recommend bringing 2-3 additional pucks to ensure smooth drills.',
      createdAt: '2025-10-29T10:37:00Z',
    },
    {
      id: '5',
      sender: 'user',
      content:
        "Great suggestion! I'll grab some extras from the equipment room.",
      createdAt: '2025-10-29T10:40:00Z',
    },
    {
      id: '6',
      sender: 'contact',
      content:
        'Also, is the game this Saturday still on? I heard there might be a storm.',
      createdAt: '2025-10-29T11:15:00Z',
    },
    {
      id: '7',
      sender: 'assistant',
      content:
        "Weather forecast shows 70% chance of snow on Saturday. League policy requires cancellation if conditions are deemed unsafe. I'll monitor the forecast and send updates by Thursday evening.",
      createdAt: '2025-10-29T11:16:00Z',
    },
    {
      id: '8',
      sender: 'user',
      content: 'Thanks for staying on top of that. Keep the team posted.',
      createdAt: '2025-10-29T11:20:00Z',
    },
    {
      id: '9',
      sender: 'contact',
      content:
        'Will do! By the way, my kid mentioned the team dinner next week. Do we have details yet?',
      createdAt: '2025-10-29T14:30:00Z',
    },
    {
      id: '10',
      sender: 'assistant',
      content:
        "Team dinner is scheduled for Friday, November 8th at 6:30 PM at Mario's Pizza Palace. Menu includes pizza, salad, and drinks. Cost is $15 per person. RSVP deadline is November 5th.",
      createdAt: '2025-10-29T14:31:00Z',
    },
    {
      id: '11',
      sender: 'contact',
      content: "Awesome! I'll let my family know. Count us in for 3 people.",
      createdAt: '2025-10-29T14:35:00Z',
    },
    {
      id: '12',
      sender: 'user',
      content:
        "Got it! I'll add your family to the list. Looking forward to seeing everyone there.",
      createdAt: '2025-10-29T14:40:00Z',
    },
  ];

  getMessageClass(sender: string) {
    return sender === 'contact' ? 'messages__message--contact' : 'messages__message--user';
  }
}
