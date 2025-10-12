import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  Input,
  TemplateRef
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';

export interface ListItem<T> {
  id: number;
  data: T;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule],
  template: ` <div class="list-container">
    @for (item of listItems; track item.id) {
    <ng-container
      *ngTemplateOutlet="contentTemplate; context: { $implicit: item }"
    ></ng-container>
    }
  </div>`,
  styleUrl: './list.component.scss',
})
export class ListComponent<T> {
  @Input() listItems: ListItem<T>[];

  @ContentChild(TemplateRef) contentTemplate!: TemplateRef<{
    $implicit: ListItem<T>;
  }>;
}
