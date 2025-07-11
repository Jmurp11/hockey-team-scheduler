import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { FooterComponent } from '../footer/footer.component';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { HeaderComponent } from '../shared/components/header/header.component';
import { LoadingService } from '../shared/services/loading.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
@Component({
  selector: 'app-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    BlockUIModule,
    ProgressSpinnerModule,
    SidebarComponent,
    HeaderComponent,
    FooterComponent
  ],
  providers: [LoadingService],
  template: ` <div class="container">
      <app-header [title]="teamName">
        <ng-template #start> </ng-template>
        <ng-template #end>
          <div class="header__avatar">
            <i
              class="bi bi-person-circle"
              style="font-size: 1.5rem; color: #002C77;"
            ></i>
          </div>
          <div class="header__name">{{ username }}</div>
        </ng-template>
      </app-header>

      <div class="content-container">
        <div class="sidebar">
          <app-sidebar></app-sidebar>
        </div>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </div>
      <app-footer />
    </div>

    <p-blockUI [blocked]="loadingService.isLoading()">
      <div class="block-ui-template">
        <p-progressSpinner
          ariaLabel="loading"
          [style]="{ width: '50px', height: '50px' }"
        ></p-progressSpinner>
      </div>
    </p-blockUI>
    <p-toast position="top-right"></p-toast>`,
  styleUrl: './container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerComponent {
  loadingService = inject(LoadingService);
  username = 'John Doe';
  teamName = 'My Team';
}
