import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  template: `
    <section class="how-it-works" id="how-it-works">
      <h2>How It Works</h2>
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
export class HowItWorksComponent {
  steps = [
    {
      number: 1,
      icon: 'pi pi-plus-circle',
      title: 'Create Your Team',
      description:
        'Add your team, set your skill level, and upload your ice schedule.',
    },
    {
      number: 2,
      icon: 'pi pi-microchip-ai',
      title: 'Let AI Do the Work',
      description:
        'RinkLinkGPT finds opponents, evaluates tournaments, and flags scheduling conflicts.',
    },
    {
      number: 3,
      icon: 'pi pi-check-circle',
      title: 'Confirm & Play',
      description:
        'Review AI suggestions, confirm games with one click, and hit the ice.',
    },
  ];
}
