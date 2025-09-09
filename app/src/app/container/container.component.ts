import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { FooterComponent } from '../footer/footer.component';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { HeaderComponent } from '../shared/components/header/header.component';
import { LoadingService } from '../shared/services/loading.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { AuthService } from '../auth/auth.service';
import { NavigationService } from '../shared/services/navigation.service';
@Component({
  selector: 'app-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    BlockUIModule,
    ProgressSpinnerModule,
    RippleModule,
    SidebarComponent,
    HeaderComponent,
    FooterComponent,
  ],
  providers: [LoadingService, NavigationService],
  template: ` <div class="container">
      <app-header
        [title]="authService.currentUser()?.team_name || 'IceTime.ai'"
      >
        <ng-template #start>
          <a pRipple class="title" (click)="navigation.navigateToLink('/app')">
            <span class="title__left">{{
              authService.currentUser()?.team_name || 'IceTime.ai'
            }}</span>
          </a>
        </ng-template>
        <ng-template #end>
          <div class="header__avatar">
            <i
              class="bi bi-person-circle"
              style="font-size: 1.5rem; color: #002C77;"
            ></i>
          </div>
          <div class="header__name">
            {{
              authService.currentUser()?.displayName ||
                authService.session()?.user?.email ||
                'User'
            }}
          </div>
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
  authService = inject(AuthService);
  navigation = inject(NavigationService);
}
