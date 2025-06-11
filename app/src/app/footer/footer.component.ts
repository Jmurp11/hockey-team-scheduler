import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: ` <div class="footer">Footer Component</div>`,
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
