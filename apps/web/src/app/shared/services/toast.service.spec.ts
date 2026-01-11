import { TestBed } from '@angular/core/testing';
import { MessageService, ToastMessageOptions } from 'primeng/api';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let mockMessageService: jest.Mocked<MessageService>;

  beforeEach(() => {
    mockMessageService = {
      add: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<MessageService>;

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MessageService, useValue: mockMessageService },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('presentToast', () => {
    it('should call messageService.add with toast options and default life of 3000ms', () => {
      const toastOptions: ToastMessageOptions = {
        severity: 'success',
        summary: 'Success',
        detail: 'Operation completed',
      };

      service.presentToast(toastOptions);

      expect(mockMessageService.add).toHaveBeenCalledWith({
        ...toastOptions,
        life: 3000,
      });
    });

    it('should preserve all passed toast options', () => {
      const toastOptions: ToastMessageOptions = {
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong',
        key: 'custom-key',
        sticky: false,
      };

      service.presentToast(toastOptions);

      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong',
        key: 'custom-key',
        sticky: false,
        life: 3000,
      });
    });

    it('should handle info severity', () => {
      const toastOptions: ToastMessageOptions = {
        severity: 'info',
        summary: 'Information',
        detail: 'Here is some info',
      };

      service.presentToast(toastOptions);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
        })
      );
    });

    it('should handle warn severity', () => {
      const toastOptions: ToastMessageOptions = {
        severity: 'warn',
        summary: 'Warning',
        detail: 'Be careful',
      };

      service.presentToast(toastOptions);

      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
        })
      );
    });

    it('should override life if provided in options with default 3000ms', () => {
      const toastOptions: ToastMessageOptions = {
        severity: 'success',
        summary: 'Test',
        detail: 'Test detail',
        life: 5000, // This will be overridden
      };

      service.presentToast(toastOptions);

      // The spread operator places life: 3000 after the options,
      // so it will override the original life value
      expect(mockMessageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 3000,
        })
      );
    });
  });

  describe('clear', () => {
    it('should call messageService.clear without key', () => {
      service.clear();

      expect(mockMessageService.clear).toHaveBeenCalledWith();
    });

    it('should clear all toast messages', () => {
      // First show some toasts
      service.presentToast({ severity: 'success', summary: 'Test 1' });
      service.presentToast({ severity: 'info', summary: 'Test 2' });

      // Then clear
      service.clear();

      expect(mockMessageService.clear).toHaveBeenCalled();
    });
  });

  describe('clearByKey', () => {
    it('should call messageService.clear with the provided key', () => {
      const key = 'custom-toast-key';

      service.clearByKey(key);

      expect(mockMessageService.clear).toHaveBeenCalledWith(key);
    });

    it('should clear only toasts with matching key', () => {
      service.clearByKey('specific-key');

      expect(mockMessageService.clear).toHaveBeenCalledWith('specific-key');
    });

    it('should handle empty string key', () => {
      service.clearByKey('');

      expect(mockMessageService.clear).toHaveBeenCalledWith('');
    });
  });
});
