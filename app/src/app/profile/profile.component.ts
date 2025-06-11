import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Profile Component</div>`,
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
