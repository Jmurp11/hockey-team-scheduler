import { NgTemplateOutlet } from '@angular/common';
import { Component, ContentChildren, Input, QueryList, TemplateRef } from '@angular/core';
import {
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [IonAccordion, IonAccordionGroup, IonItem, IonLabel, NgTemplateOutlet],
  template: `
    <ion-accordion-group>
      @for (value of values; track value; let i = $index) {
        <ion-accordion [value]="value" [disabled]="disabled">
          <ion-item slot="header" color="light">
            <ion-label>{{ value }}</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">
            @if (templates && templates.get(i)) {
              <ng-container *ngTemplateOutlet="templates.get(i)!" />
            }
          </div>
        </ion-accordion>
      }
    </ion-accordion-group>
  `,
  styles: [],
})
export class AccordionComponent {
  @Input() values?: string[];
  @Input() disabled?: boolean;
  @ContentChildren(TemplateRef) templates?: QueryList<TemplateRef<unknown>>;
}
