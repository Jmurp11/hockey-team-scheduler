import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-get-started',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <p-button
      [rounded]="true"
      [size]="size"
      label="Get Started"
      (onClick)="navigateToPricing()"
    />
  `,
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetStartedComponent {
  @Input()
  size: 'small' | 'large' | undefined;

  private router = inject(Router);

  constructor() {}

  navigateToPricing(): void {
    this.router.navigate(['/pricing']);
  }
}
