import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `<div>
    <app-sidebar />
    <router-outlet></router-outlet>
  </div>`,
  styleUrl: './container.component.scss',
})
export class ContainerComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
