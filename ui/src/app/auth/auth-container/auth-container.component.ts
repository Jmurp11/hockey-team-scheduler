import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-auth-container',
  standalone: true,
  imports: [CommonModule],
  providers: [],
  template: `
    <div class="auth-container">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./auth-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthContainerComponent {}
