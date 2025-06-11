import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';

interface ListItem<T> {
  id: number;
  data: T;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule],
  template: ` <div class="list-container">
    @for (item of listItems; track item.id) {
    <div class="card-wrapper">
      <p-card>
        <ng-template #header>
          <h3>{{ item.data.title }}</h3>
        </ng-template>
        <ng-template #content>
          <p>{{ item.data.description }}</p>
        </ng-template>
      </p-card>
    </div>
    }
  </div>`,
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit {
  @Input() listItems: any[];

  constructor() {}

  ngOnInit(): void {}
}
