import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, FooterComponent],
  template: ` <div class="container">
    <div class="sidebar">
      <app-sidebar></app-sidebar>
    </div>
    <div class="content">
      <app-header></app-header>
      <router-outlet class="router-content"></router-outlet>
    </div>
  </div>`,
  styleUrl: './container.component.scss',
})
export class ContainerComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
