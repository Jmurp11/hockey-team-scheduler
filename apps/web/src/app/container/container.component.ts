import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService, NavigationService } from '@hockey-team-scheduler/shared-ui';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SidebarService } from '../sidebar/sidebar.service';

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
  providers: [],
  template: ` <div class="container">
      <div
        class="sidebar-wrapper"
        [class.sidebar-open]="sidebarService.isOpen()"
      >
        <app-sidebar></app-sidebar>
      </div>

      @if (sidebarService.isOpen() && isMobile) {
      <div class="sidebar-overlay" (click)="sidebarService.close()"></div>
      }

      <div class="container__page-content">
        <app-header
          [showHamburger]="isMobile"
          (hamburgerClick)="sidebarService.toggle()"
        >
          <ng-template #start>
            @if (!hideTitle) {
            <a
              pRipple
              class="title"
              (click)="navigation.navigateToLink('/app')"
            >
              <span class="title__left">{{
                authService.currentUser()?.team_name || 'RinkLink.ai'
              }}</span>
            </a>
            }
          </ng-template>
          <ng-template #end>
            <div class="header__name">
              {{
                authService.currentUser()?.display_name ||
                  authService.session()?.user?.email ||
                  'User' | uppercase
              }}
            </div>
          </ng-template>
        </app-header>
        <div class="container__page-content__router-outlet">
          <router-outlet></router-outlet>
        </div>
      </div>
      @if (!isMobile) {
      <app-footer />
      }
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
export class ContainerComponent implements OnInit {
  loadingService = inject(LoadingService);
  authService = inject(AuthService);
  navigation = inject(NavigationService);
  sidebarService = inject(SidebarService);

  isMobile = false;
  hideTitle = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const previousIsMobile = this.isMobile;
    this.hideTitle = window.innerWidth <= 767; // Tablets and mobile

    this.isMobile = window.innerWidth <= 1024; // Mobile only
    if (previousIsMobile !== this.isMobile) {
      if (this.isMobile) {
        this.sidebarService.close();
      } else {
        this.sidebarService.open();
      }
    }
  }
}
