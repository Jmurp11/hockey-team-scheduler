import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BlockUIModule } from 'primeng/blockui';
import { PrimeNG } from 'primeng/config';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { LoadingService } from './shared/services/loading.service';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ProgressSpinnerModule,
    CommonModule,
    ToastModule,
    BlockUIModule,
  ],
  providers: [LoadingService],
  template: ` <p-blockUI [blocked]="loadingService.isLoading()">
      <div class="block-ui-template">
        <p-progressSpinner
          ariaLabel="loading"
          [style]="{ width: '50px', height: '50px' }"
        ></p-progressSpinner>
      </div>
    </p-blockUI>

    <div class="app">
      <router-outlet />
    </div>

    <p-toast position="top-right"></p-toast>`,
  styleUrl: './app.scss',
})
export class App {
  private primeng = inject(PrimeNG);
  loadingService = inject(LoadingService);
  protected title = 'app';

  ngOnInit() {
    this.primeng.ripple.set(true);
  }
}
