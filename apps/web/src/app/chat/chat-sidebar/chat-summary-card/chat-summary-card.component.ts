import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, } from '@angular/core';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ChatSummary } from '@hockey-team-scheduler/shared-utilities';
@Component({
  selector: 'app-chat-summary-card',
  standalone: true,
  imports: [CardComponent, NgStyle],
  template: `
    <app-card>
      <ng-template #title>{{ chatSummary.title }}</ng-template>
      <ng-template #content>
        <div class="content">
          @for (item of chatSummary.content; track item.label) {
          <div class="content__item">
            <span class="label">{{ item.label }}</span>
            <span class="value" [ngStyle]="valueStyle(item.value)">{{
              item.value
            }}</span>
          </div>
          }
        </div>
      </ng-template>
    </app-card>
  `,
  styleUrls: ['./chat-summary-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatSummaryCardComponent {
  @Input() chatSummary!: ChatSummary;

  valueStyle(value: string) {
    if (value === 'Active') {
      return { color: '#15ed4f', 'font-weight': 'bold' };
    } else if (value === 'Inactive') {
      return { color: '#fc5c38', 'font-weight': 'bold' };
    } else {
      return {};
    }
  }
}
