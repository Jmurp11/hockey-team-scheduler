import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  template: `
    <section class="how-it-works" id="how-it-works">
      <h2>How AI Youth Hockey Team Management Works</h2>
      <div class="how-it-works__steps">
        @for (step of steps; track step.number) {
          <div class="how-it-works__step">
            <div class="how-it-works__number">{{ step.number }}</div>
            <i [class]="step.icon"></i>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styleUrls: ['./how-it-works.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to use AI for youth hockey team management',
      description:
        'Get started with RinkLink\'s AI-powered hockey team scheduler in three simple steps.',
      step: this.steps.map((s) => ({
        '@type': 'HowToStep',
        name: s.title,
        text: s.description,
        position: s.number,
      })),
    });
  }

  steps = [
    {
      number: 1,
      icon: 'pi pi-plus-circle',
      title: 'Create Your Team',
      description:
        'Add your youth hockey team, set your skill level, and upload your ice schedule to the hockey team scheduler.',
    },
    {
      number: 2,
      icon: 'pi pi-microchip-ai',
      title: 'Let AI Do the Work',
      description:
        'RinkLink\'s AI finds opponents, evaluates tournament fit, and flags scheduling conflicts — automated youth hockey team management.',
    },
    {
      number: 3,
      icon: 'pi pi-check-circle',
      title: 'Confirm & Play',
      description:
        'Review AI suggestions, confirm games with one click, and hit the ice. Hockey tournament management made simple.',
    },
  ];
}
