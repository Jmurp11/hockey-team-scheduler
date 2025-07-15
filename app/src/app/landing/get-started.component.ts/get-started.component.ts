import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { NavigationService } from '../../shared/services/navigation.service';

@Component({
  selector: 'app-get-started',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  providers: [NavigationService],
  template: `
    <p-button
      [rounded]="true"
      [size]="size"
      label="Get Started"
      
      (onClick)="navigation.navigateToLink('/pricing')"
    />
  `,
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetStartedComponent {
  @Input()
  size: 'small' | 'large' | undefined;

  navigation = inject(NavigationService);

  constructor() {}
}
