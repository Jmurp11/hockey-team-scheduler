import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  template: ` <p-card>
    <ng-template #title>Upload Ice Slots</ng-template>
    <ng-template #content>
      <p-button
        icon="pi pi-plus"
        [rounded]="true"
        severity="success"
        [outlined]="true"
        size="large"
    /></ng-template>
  </p-card>`,
  styleUrl: './dashboard-card.component.scss',
})
export class DashboardCardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
