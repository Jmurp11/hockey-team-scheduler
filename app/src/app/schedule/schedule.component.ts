import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ListComponent } from '../shared/components/list/list.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, ListComponent],
  template: `
    <div>Schedule Component</div>
    <app-list [listItems]="listItems" />`,
  styleUrl: './schedule.component.scss',
})
export class ScheduleComponent implements OnInit {
  listItems = [
    { id: 1, data: { title: 'Schedule 1', description: 'Description 1' } },
    { id: 2, data: { title: 'Schedule 2', description: 'Description 2' } },
    { id: 3, data: { title: 'Schedule 3', description: 'Description 3' } },
  ];

  constructor() {}

  ngOnInit(): void {}
}
