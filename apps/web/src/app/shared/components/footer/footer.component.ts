import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import packageInfo from '../../../../../../../package.json';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: ` <div class="footer">
    @if (!isMobile) {
      <div class="footer__content">
        <div class="footer__policies">
          <div>Terms of Service</div>
          <div>Privacy Policy</div>
        </div>
        <div>&#64;2025 RINKLINKAI LLC All Rights Reserved</div>
        <div class="footer__socials">
          @for (social of socials; track social.name) {
            <div>
              <i
                [class]="social.icon"
                style="font-size: 1rem"
                (click)="navigate(social.name)"
              ></i>
            </div>
          }
          <div>v{{ packageInfo.version }}</div>
        </div>
      </div>
    }
  </div>`,
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit {
  packageInfo = packageInfo;

  isMobile = false;

  socials = [
    { name: 'twitter', icon: 'pi pi-twitter', url: 'https://x.com/RinkLinkAI' },
    {
      name: 'instagram',
      icon: 'pi pi-instagram',
      url: 'https://www.instagram.com/rinklink.ai/',
    },
    {
      name: 'youtube',
      icon: 'pi pi-youtube',
      url: 'https://www.youtube.com/channel/UC-KQvlXxb-4ren-nSuJxwww',
    },
  ];

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 1024;
  }

  navigate(platform: string) {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = 'https://x.com/RinkLinkAI';
        break;
      case 'instagram':
        url = 'https://www.instagram.com/rinklinkai/';
        break;
      case 'youtube':
        url = 'https://www.youtube.com/channel/UC-KQvlXxb-4ren-nSuJxwww';
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  }
}
