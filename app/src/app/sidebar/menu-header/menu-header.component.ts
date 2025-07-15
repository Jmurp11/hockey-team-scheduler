import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div class="logo"></div>`,
  styleUrl: './menu-header.component.scss',
})
export class MenuHeaderComponent implements OnInit {
  @Input() title: string;
  constructor() {}

  ngOnInit(): void {}
}
