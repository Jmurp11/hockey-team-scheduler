import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [],
  template: `
    <div class="sidebar">
      <p style="color: white; padding: 1rem;">Chat Sidebar</p>
    </div>
  `,
  styleUrls: ['./chat-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class ChatSidebarComponent {}
