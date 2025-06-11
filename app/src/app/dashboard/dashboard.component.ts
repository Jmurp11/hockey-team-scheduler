import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardCardComponent } from './dashboard-card/dashboard-card.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardCardComponent],
  template: ` 
    <div><app-dashboard-card /></div>`,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
