import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef
} from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <p-card>
      <ng-template pTemplate="header"
        ><ng-container *ngTemplateOutlet="header"></ng-container
      ></ng-template>
      <ng-template pTemplate="title"
        ><ng-container *ngTemplateOutlet="title"></ng-container
      ></ng-template>
      <ng-template pTemplate="subtitle"
        ><ng-container *ngTemplateOutlet="subtitle"></ng-container
      ></ng-template>
      <ng-template pTemplate="content">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </ng-template>
      <ng-template pTemplate="footer"
        ><ng-container *ngTemplateOutlet="footer"></ng-container
      ></ng-template>
    </p-card>
  `,
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @ContentChild('header') header: TemplateRef<any> | undefined;
  @ContentChild('title') title: TemplateRef<any> | undefined;
  @ContentChild('subtitle') subtitle: TemplateRef<any> | undefined;
  @ContentChild('content') content: TemplateRef<any> | undefined;
  @ContentChild('footer') footer: TemplateRef<any> | undefined;
}
