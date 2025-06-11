import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, IftaLabelModule, FormsModule],
  template: ` <header class="header">
    <div class="header__toolbar">
      <div class="header__container">
        <div class="">Team name + Logo</div>
        <div class="header__avatar-container">
          <div class="header__avatar">
            <i
              class="bi bi-person-circle"
              style="font-size: 1.5rem; color: #002C77;"
            ></i>
          </div>
          <div class="header__name-container">
            <div class="header__name">{{ username }}</div>
          </div>
        </div>
      </div>
    </div>
  </header>`,
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  username = 'John Doe';
  searchValue = '';

  constructor() {}

  ngOnInit(): void {}
}
