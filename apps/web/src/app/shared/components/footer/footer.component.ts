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
      <div>&#64;2025 RinkLink.ai All Rights Reserved</div>
      <div class="footer__socials">
        <div><i class="pi pi-twitter" style="font-size: 1rem"></i></div>
        <div><i class="pi pi-instagram" style="font-size: 1rem"></i></div>
        <div><i class="pi pi-discord" style="font-size: 1rem"></i></div>
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
}
