import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChatSummary } from '../../shared/types/chat-summary.type';
import { ChatSummaryCardComponent } from './chat-summary-card/chat-summary-card.component';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [ChatSummaryCardComponent],
  template: `
    <div class="sidebar">
      @for (item of chatSummaries; track item.title) {
      <app-chat-summary-card [chatSummary]="item"></app-chat-summary-card>
      }
    </div>
  `,
  styleUrls: ['./chat-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatSidebarComponent {
  @Input() chatSummaries!: ChatSummary[];
}
