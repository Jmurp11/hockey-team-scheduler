import { ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Manager } from '@hockey-team-scheduler/shared-utilities';
import { ContactSchedulerDialogService } from './contact-scheduler.service';
import { ContactSchedulerComponent } from './contact-scheduler.component';

describe('ContactSchedulerDialogService', () => {
  let service: ContactSchedulerDialogService;
  let mockViewContainerRef: jest.Mocked<ViewContainerRef>;
  let mockComponentRef: any;

  const mockManager: Manager = {
    id: 'manager-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    team: 'Rye Rangers',
    association: 'NYSAHA',
  };

  beforeEach(() => {
    mockComponentRef = {
      instance: {
        manager: null,
      },
      destroy: jest.fn(),
    };

    mockViewContainerRef = {
      createComponent: jest.fn().mockReturnValue(mockComponentRef),
      clear: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [ContactSchedulerDialogService],
    });

    service = TestBed.inject(ContactSchedulerDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with dialog not visible', () => {
    expect(service.isVisible()).toBe(false);
  });

  describe('setViewContainerRef', () => {
    it('should store the view container reference', () => {
      service.setViewContainerRef(mockViewContainerRef);

      expect(service['viewContainerRef']).toBe(mockViewContainerRef);
    });
  });

  describe('openDialog', () => {
    beforeEach(() => {
      service.setViewContainerRef(mockViewContainerRef);
    });

    it('should create ContactSchedulerComponent', () => {
      service.openDialog(mockManager);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledWith(
        ContactSchedulerComponent
      );
    });

    it('should set manager data on component instance', () => {
      service.openDialog(mockManager);

      expect(mockComponentRef.instance.manager).toBe(mockManager);
    });

    it('should set isVisible to true', () => {
      service.openDialog(mockManager);

      expect(service.isVisible()).toBe(true);
    });

    it('should close existing dialog before opening new one', () => {
      service.openDialog(mockManager);
      const firstRef = service['componentRef'];

      const secondManager: Manager = {
        ...mockManager,
        id: 'manager-2',
        name: 'Jane Smith',
      };
      service.openDialog(secondManager);

      expect(firstRef?.destroy).toHaveBeenCalled();
      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(2);
    });

    it('should not create component if view container ref not set', () => {
      const serviceWithoutVcr = new ContactSchedulerDialogService();

      serviceWithoutVcr.openDialog(mockManager);

      expect(serviceWithoutVcr.isVisible()).toBe(true);
      expect(serviceWithoutVcr['componentRef']).toBeNull();
    });

    it('should handle multiple openDialog calls with different managers', () => {
      const manager1 = { ...mockManager, id: 'manager-1' };
      const manager2 = { ...mockManager, id: 'manager-2', name: 'Jane' };

      service.openDialog(manager1);
      service.openDialog(manager2);

      expect(mockComponentRef.instance.manager).toBe(manager2);
    });
  });

  describe('closeDialog', () => {
    beforeEach(() => {
      service.setViewContainerRef(mockViewContainerRef);
    });

    it('should destroy component when dialog is open', () => {
      service.openDialog(mockManager);

      service.closeDialog();

      expect(mockComponentRef.destroy).toHaveBeenCalled();
    });

    it('should set isVisible to false', () => {
      service.openDialog(mockManager);

      service.closeDialog();

      expect(service.isVisible()).toBe(false);
    });

    it('should set componentRef to null', () => {
      service.openDialog(mockManager);

      service.closeDialog();

      expect(service['componentRef']).toBeNull();
    });

    it('should handle closing when dialog is not open', () => {
      service.closeDialog();

      expect(service.isVisible()).toBe(false);
    });

    it('should not throw when closing multiple times', () => {
      service.openDialog(mockManager);
      service.closeDialog();

      expect(() => service.closeDialog()).not.toThrow();
    });
  });

  describe('toggleDialog', () => {
    it('should toggle from false to true', () => {
      expect(service.isVisible()).toBe(false);

      service.toggleDialog();

      expect(service.isVisible()).toBe(true);
    });

    it('should toggle from true to false', () => {
      service['_isVisible'].set(true);

      service.toggleDialog();

      expect(service.isVisible()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      service.toggleDialog();
      expect(service.isVisible()).toBe(true);

      service.toggleDialog();
      expect(service.isVisible()).toBe(false);

      service.toggleDialog();
      expect(service.isVisible()).toBe(true);
    });
  });

  describe('isVisible signal', () => {
    it('should be a readonly signal', () => {
      const isVisible = service.isVisible;

      expect(isVisible).toBeDefined();
      expect(typeof isVisible).toBe('function');
    });

    it('should reflect state changes from openDialog', () => {
      service.setViewContainerRef(mockViewContainerRef);

      expect(service.isVisible()).toBe(false);

      service.openDialog(mockManager);
      expect(service.isVisible()).toBe(true);
    });

    it('should reflect state changes from closeDialog', () => {
      service.setViewContainerRef(mockViewContainerRef);
      service.openDialog(mockManager);

      service.closeDialog();

      expect(service.isVisible()).toBe(false);
    });

    it('should reflect state changes from toggleDialog', () => {
      service.toggleDialog();
      expect(service.isVisible()).toBe(true);

      service.toggleDialog();
      expect(service.isVisible()).toBe(false);
    });
  });
});
