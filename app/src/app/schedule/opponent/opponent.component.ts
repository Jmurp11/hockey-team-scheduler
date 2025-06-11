import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-opponent',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Opponent Component</div>`,
  styleUrl: './opponent.component.scss',
})
export class OpponentComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
