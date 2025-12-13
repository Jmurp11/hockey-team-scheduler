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
      [rounded]="rounded"
      [size]="size"
      label="Get Started"
      [variant]="variant"
      (onClick)="navigation.navigateToLink('/pricing')"
    />
  `,
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetStartedComponent {
  @Input()
  size: 'small' | 'large' | undefined;

  @Input()
  rounded: boolean = true;

  @Input()
  variant?: 'text' | 'outlined';;
  navigation = inject(NavigationService);

  
}
