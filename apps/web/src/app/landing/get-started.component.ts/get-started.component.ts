import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { NavigationService } from '@hockey-team-scheduler/shared-ui';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-get-started',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  providers: [],
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

  
}
