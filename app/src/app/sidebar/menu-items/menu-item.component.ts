import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div class="menu-item">
    <div [routerLink]="item.routerLink">
      <i [class]="item.icon"></i>
      <span>{{ item.label }}</span>
    </div>
  </div>`,
  styleUrl: './menu-item.component.scss',
})
export class MenuItemComponent implements OnInit {
  @Input() item!: MenuItem;

  

  ngOnInit(): void {}
}
