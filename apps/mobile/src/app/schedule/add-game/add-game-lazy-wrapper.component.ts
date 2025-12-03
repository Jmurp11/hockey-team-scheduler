import { Component, inject, ViewContainerRef, ComponentRef, effect } from '@angular/core';
import { AddGameModalService } from './add-game-modal.service';

@Component({
  selector: 'app-add-game-lazy-wrapper',
  standalone: true,
  template: `
    <ng-container #lazyContainer></ng-container>
  `,
  imports: []
})
export class AddGameLazyWrapperComponent {
  addGameModalService = inject(AddGameModalService);
  private viewContainer = inject(ViewContainerRef);
  
  private componentRef: ComponentRef<unknown> | null = null;

  constructor() {
    effect(async () => {
      if (this.addGameModalService.isOpen()) {
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
      const { AddGameComponent } = await import('./add-game.component');
      
      // Create the component dynamically
      this.componentRef = this.viewContainer.createComponent(AddGameComponent);
    } catch (error) {
      console.error('Failed to load AddGameComponent:', error);
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