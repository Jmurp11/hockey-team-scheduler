import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Suggestions Component</div>`,
  styleUrl: './suggestions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionsComponent {
}
