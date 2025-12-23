import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ContentChildren,
  DestroyRef,
  inject,
  Input,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    NgTemplateOutlet,
  ],
  template: `
    <ion-accordion-group [value]="openedAccordion">
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
export class AccordionComponent implements OnInit {
  @Input() values?: string[];
  @Input() disabled?: boolean;
  @ContentChildren(TemplateRef) templates?: QueryList<TemplateRef<unknown>>;

  @Input() isCollapsed$!: Observable<boolean>;
  openedAccordion: string | null = null;

  destroyRef = inject(DestroyRef);
  ngOnInit(): void {
    if (this.values && this.values.length > 0) {
      this.openedAccordion = this.values[0];
    }

    this.isCollapsed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((collapsed) => {
        if (collapsed) {
          this.openedAccordion = null;
        }
      });
  }
}
