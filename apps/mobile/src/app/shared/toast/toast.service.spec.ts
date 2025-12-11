import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let toastController: jest.Mocked<ToastController>;
  let mockToast: jest.Mocked<HTMLIonToastElement>;

  beforeEach(() => {
    mockToast = {
      present: jest.fn(),
    } as any;
    toastController = {
      create: jest.fn().mockResolvedValue(mockToast),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: ToastController, useValue: toastController },
      ],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('presentToast', () => {
    it('should create and present a toast with default parameters', async () => {
      const message = 'Test message';
      const color = 'primary';

      const result = await service.presentToast(message, undefined, undefined, color);

      expect(toastController.create).toHaveBeenCalledWith({
        message,
        duration: 2000,
        position: 'bottom',
        color,
        buttons: [
          {
            text: 'Dismiss',
            role: 'cancel',
          },
        ],
      });
      expect(mockToast.present).toHaveBeenCalled();
      expect(result).toBe(mockToast);
    });

    it('should create and present a toast with custom parameters', async () => {
      const message = 'Custom message';
      const duration = 5000;
      const position = 'top';
      const color = 'warning';

      const result = await service.presentToast(message, duration, position, color);

      expect(toastController.create).toHaveBeenCalledWith({
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
      expect(mockToast.present).toHaveBeenCalled();
      expect(result).toBe(mockToast);
    });
  });

  describe('presentErrorToast', () => {
    it('should present an error toast with correct parameters', async () => {
      const message = 'Error message';

      const result = await service.presentErrorToast(message);

      expect(toastController.create).toHaveBeenCalledWith({
        message,
        duration: 3000,
        position: 'top',
        color: 'danger',
        buttons: [
          {
            text: 'Dismiss',
            role: 'cancel',
          },
        ],
      });
      expect(mockToast.present).toHaveBeenCalled();
      expect(result).toBe(mockToast);
    });
  });

  describe('presentSuccessToast', () => {
    it('should present a success toast with correct parameters', async () => {
      const message = 'Success message';

      const result = await service.presentSuccessToast(message);

      expect(toastController.create).toHaveBeenCalledWith({
        message,
        duration: 2000,
        position: 'bottom',
        color: 'success',
        buttons: [
          {
            text: 'Dismiss',
            role: 'cancel',
          },
        ],
      });
      expect(mockToast.present).toHaveBeenCalled();
      expect(result).toBe(mockToast);
    });
  });
});