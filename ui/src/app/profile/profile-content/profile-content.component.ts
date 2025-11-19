import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';
import { Profile } from '../../shared/types/profile.type';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `<app-card class="card">
    <ng-template #title>User Information</ng-template>
    <ng-template #content>
      @for (field of card | keyvalue; track field.key) {
      <div class="info-row">
        <span class="info-row__label">{{ field.key | titlecase }}:</span>
        <span class="info-row__value">
          {{ checkField(field.value) }}
        </span>
      </div>
      }
    </ng-template>
  </app-card>`,
  styleUrl: './profile-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileContentComponent {
  @Input() card: Profile;

  checkField(value: string | string[] | number): string {
    if (Array.isArray(value)) {
      return value.length ? value.join(', ') : '';
    }
    return value.toString() || '';
  }
}
