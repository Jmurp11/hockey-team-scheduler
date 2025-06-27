import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  providers: [],
  template: ` <router-outlet />`,
  styleUrl: './app.scss',
})
export class App {
  private primeng = inject(PrimeNG);
  protected title = 'app';

  ngOnInit() {
    this.primeng.ripple.set(true);
  }
}
