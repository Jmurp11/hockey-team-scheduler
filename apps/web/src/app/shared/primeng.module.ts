import { NgModule } from '@angular/core';

// PrimeNG modules - only import what you actually use
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { MenubarModule } from 'primeng/menubar';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';

const PRIMENG_MODULES = [
  ButtonModule,
  SelectButtonModule,
  SelectModule,
  IftaLabelModule,
  MessageModule,
  MenubarModule,
  BlockUIModule,
  ProgressSpinnerModule,
  RippleModule,
  ToastModule,
];

@NgModule({
  imports: PRIMENG_MODULES,
  exports: PRIMENG_MODULES,
})
export class PrimeNGModule {}
