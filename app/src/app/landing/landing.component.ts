import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { HeaderComponent } from '../shared/components/header/header.component';
import { NavigationService } from '../shared/services/navigation.service';
import { GetStartedComponent } from './get-started.component.ts/get-started.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    GetStartedComponent,
  ],
  providers: [NavigationService],
  template: `<div class="container">
    <app-header [items]="items" [title]="appTitle">
      <ng-template #start>
        <a pRipple class="title" (click)="navigation.navigateToLink('/')">
          <span class="title__left">{{ titleSplit[0] }}</span>
          <span class="title__right">.{{ titleSplit[1] }}</span>
        </a>
      </ng-template>
      <ng-template #end>
        <div class="right-header">
          <div>
            <a
              pRipple
              class="flex items-center p-menubar-item-link"
              (click)="navigation.navigateToLink('login')"
            >
              <span>Login</span>
            </a>
          </div>
          <div>
            <app-get-started size="small" />
          </div>
        </div>
      </ng-template>
    </app-header>

    <div class="main-content">
      <router-outlet />
    </div>

    <app-footer />
  </div>`,
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  navigation = inject(NavigationService);

  appTitle = 'IceTime.ai';

  items: MenuItem[] = [
    {
      label: 'Features',
      routerLink: '/features',
    },
    {
      label: 'Pricing',
      routerLink: '/pricing',
    },
    {
      label: 'Contact',
      routerLink: '/contact',
    },
  ];

  titleSplit: string[] = [];
  
  

  ngOnInit(): void {
    this.titleSplit = this.splitTitle(this.appTitle);
  }

  splitTitle(title: string): string[] {
    return title.split('.');
  }
}
