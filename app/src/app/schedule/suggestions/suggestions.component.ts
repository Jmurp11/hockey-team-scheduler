import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<div>Suggestions Component</div>`,
  styleUrl: './suggestions.component.scss',
})
export class SuggestionsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
