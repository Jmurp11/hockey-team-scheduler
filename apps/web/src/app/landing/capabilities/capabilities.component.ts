import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-capabilities',
  standalone: true,
  template: `
    <section class="capabilities">
      <h2>Everything Else You Need</h2>
      <p class="capabilities__subtitle">
        Powerful scheduling tools that work without AI
      </p>
      <div class="capabilities__grid">
        @for (item of items; track item.label) {
          <div class="capabilities__item">
            <i [class]="item.icon"></i>
            <div>
              <h3>{{ item.label }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrls: ['./capabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilitiesComponent {
  items = [
    {
      icon: 'pi pi-upload',
      label: 'Bulk Ice Import',
      description:
        'Upload your entire ice schedule from a spreadsheet in seconds.',
    },
    {
      icon: 'pi pi-calendar',
      label: 'Season Calendar',
      description:
        'View practices, games, and tournaments in one unified calendar.',
    },
    {
      icon: 'pi pi-download',
      label: 'Schedule Export',
      description:
        'Export in formats compatible with SportsEngine, Crossbar, and more.',
    },
  ];
}
