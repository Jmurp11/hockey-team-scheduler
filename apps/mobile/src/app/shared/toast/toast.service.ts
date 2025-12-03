import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async presentToast(
    message: string,
    duration: number = 2000,
    position: 'top' | 'middle' | 'bottom' = 'bottom',
    color: string,
  ) {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      color,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
    return toast;
  }

  async presentErrorToast(message: string) {
    return this.presentToast(message, 3000, 'top', 'danger');
  }

  async presentSuccessToast(message: string) {
    return this.presentToast(message, 2000, 'bottom', 'success');
  }
}
