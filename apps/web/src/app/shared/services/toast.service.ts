import { inject, Injectable } from '@angular/core';
import { MessageService, ToastMessageOptions } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private messageService = inject(MessageService);

  presentToast(toastOptions: ToastMessageOptions): void {
    this.messageService.add({
      ...toastOptions,
      life: 3000,
    });
  }

  clear(): void {
    this.messageService.clear();
  }

  clearByKey(key: string): void {
    this.messageService.clear(key);
  }
}
