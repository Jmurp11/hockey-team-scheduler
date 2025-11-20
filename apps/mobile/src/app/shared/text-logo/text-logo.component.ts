import { Component } from '@angular/core';

@Component({
  selector: 'app-text-logo',
  template: ` <div class="logo-container">
    <span class="logo"
      >{{ title }}<span class="ai">{{ extension }}</span>
    </span>
  </div>`,
  styles: [
    `
      .logo-container {
        padding: 4rem;
        display: grid;
        grid-template-rows: 60px 1fr;
        font-size: 2.5rem;
      }

      .logo {
        text-align: center;
        font-size: 3rem;
        font-weight: 600;

        color: var(--primary-500);

        .ai {
          margin: 0;
          color: var(--secondary-500);
        }
      }
    `,
  ],
})
export class TextLogoComponent {
  title = 'RinkLink';
  extension = '.ai';
}
