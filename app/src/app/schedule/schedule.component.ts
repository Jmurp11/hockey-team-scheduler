import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Schedule Component</div>`,
  styleUrl: './schedule.component.scss',
})
export class ScheduleComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
