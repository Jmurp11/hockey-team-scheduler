import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Dashboard Component</div>`,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
