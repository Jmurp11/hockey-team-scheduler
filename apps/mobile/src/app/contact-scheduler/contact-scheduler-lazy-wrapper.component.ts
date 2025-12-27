import {
  Component,
  inject,
  ViewContainerRef,
  ComponentRef,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ContactSchedulerDialogService } from './contact-scheduler.service';

@Component({
  selector: 'app-contact-scheduler-lazy-wrapper',
  standalone: true,
  template: ` <ng-container #lazyContainer></ng-container> `,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSchedulerLazyWrapperComponent {
  contactSchedulerDialogService = inject(ContactSchedulerDialogService);
  private viewContainer = inject(ViewContainerRef);

  private componentRef: ComponentRef<unknown> | null = null;

  constructor() {
    effect(async () => {
      if (this.contactSchedulerDialogService.isOpen()) {
        await this.loadComponent();
      } else {
        this.unloadComponent();
      }
    });
  }

  private async loadComponent() {
    if (this.componentRef) {
      return; // Component already loaded
    }

    try {
      // Dynamically import the component
      const { ContactSchedulerComponent } =
        await import('./contact-scheduler.component');

      // Create the component dynamically
      this.componentRef = this.viewContainer.createComponent(
        ContactSchedulerComponent,
      );
      console.log('ContactSchedulerComponent loaded dynamically');
    } catch (error) {
      console.error('Failed to load ContactSchedulerComponent:', error);
    }
  }

  private unloadComponent() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
      this.viewContainer.clear();
    }
  }
}
