import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-opponent',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Opponent Component</div>`,
  styleUrl: './opponent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentComponent {}
