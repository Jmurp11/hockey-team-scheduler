import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mobile',
  standalone: true,
  template: `
    <article class="mobile">
      <div class="mobile__content">
        <div class="mobile__text">
          <h2>Works wherever your teams are</h2>
          <p>
            RinkLink is available on web, iOS, and Android — so coaches,
            managers, and administrators can manage schedules and communication
            from anywhere.
          </p>
          <ul>
            @for (point of points; track point) {
              <li>{{ point }}</li>
            }
          </ul>
          <div class="mobile__badges">
            <img
              src="app-store.svg"
              alt="Download on the App Store"
              loading="lazy"
              width="135"
              height="40"
            />
            <img
              src="play-store.png"
              alt="Get it on Google Play"
              loading="lazy"
              width="135"
              height="40"
            />
          </div>
        </div>
        <div class="mobile__image">
          <img
            src="mobile-preview.gif"
            alt="RinkLink mobile app on iPhone and Android devices"
            loading="lazy"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </article>
  `,
  styleUrls: ['./mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileComponent {
  points = [
    'Access RinkLinkGPT on the go',
    'Review games and tournaments from anywhere',
    'Available with your RinkLink subscription',
  ];
}
