import { ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AddGameDialogService } from './add-game-dialog.service';
import { AddGameComponent } from './add-game.component';

describe('AddGameDialogService', () => {
  let service: AddGameDialogService;
  let mockViewContainerRef: jest.Mocked<ViewContainerRef>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockComponentRef: any;

  beforeEach(() => {
    mockComponentRef = {
      instance: {
        gameData: null,
        editMode: false,
      },
      destroy: jest.fn(),
    };

    mockViewContainerRef = {
      createComponent: jest.fn().mockReturnValue(mockComponentRef),
      clear: jest.fn(),
    } as any;
    mockViewContainerRef.createComponent.mockReturnValue(mockComponentRef);

    TestBed.configureTestingModule({
      providers: [AddGameDialogService],
    });
    service = TestBed.inject(AddGameDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with dialog not visible', () => {
    expect(service.isVisible()).toBe(false);
  });

  describe('setViewContainerRef', () => {
    it('should set view container ref', () => {
      service.setViewContainerRef(mockViewContainerRef);
      expect(service['viewContainerRef']).toBe(mockViewContainerRef);
    });
  });

  describe('openDialog', () => {
    beforeEach(() => {
      service.setViewContainerRef(mockViewContainerRef);
    });

    it('should open dialog with default parameters', () => {
      service.openDialog();

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledWith(
        // @ts-expect-error - Jasmine type compatibility issue
        AddGameComponent,
      );
      expect(service.isVisible()).toBe(true);
      expect(mockComponentRef.instance.gameData).toBeNull();
      expect(mockComponentRef.instance.editMode).toBe(false);
    });

    it('should open dialog with game data', () => {
      const gameData = { id: '1', homeTeam: 'Team A', awayTeam: 'Team B' };
      
      service.openDialog(gameData);

      expect(mockComponentRef.instance.gameData).toBe(gameData);
      expect(service.isVisible()).toBe(true);
    });

    it('should open dialog in edit mode', () => {
      const gameData = { id: '1', homeTeam: 'Team A', awayTeam: 'Team B' };
      
      service.openDialog(gameData, true);

      expect(mockComponentRef.instance.gameData).toBe(gameData);
      expect(mockComponentRef.instance.editMode).toBe(true);
      expect(service.isVisible()).toBe(true);
    });

    it('should close existing dialog before opening new one', () => {
      service.openDialog();
      const firstRef = service['componentRef'];

      service.openDialog();

      expect(firstRef?.destroy).toHaveBeenCalled();
      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(2);
    });

    it('should not create component if view container ref not set', () => {
      const serviceWithoutVcr = new AddGameDialogService();
      
      serviceWithoutVcr.openDialog();

      expect(serviceWithoutVcr.isVisible()).toBe(true);
      expect(serviceWithoutVcr['componentRef']).toBeNull();
    });
  });

  describe('closeDialog', () => {
    beforeEach(() => {
      service.setViewContainerRef(mockViewContainerRef);
    });

    it('should close dialog and destroy component', () => {
      service.openDialog();
      
      service.closeDialog();

      expect(mockComponentRef.destroy).toHaveBeenCalled();
      expect(service.isVisible()).toBe(false);
      expect(service['componentRef']).toBeNull();
    });

    it('should handle closing when dialog is not open', () => {
      service.closeDialog();

      expect(service.isVisible()).toBe(false);
    });

    it('should not throw error when closing multiple times', () => {
      service.openDialog();
      service.closeDialog();
      
      expect(() => service.closeDialog()).not.toThrow();
    });
  });

  describe('toggleDialog', () => {
    it('should toggle dialog visibility from false to true', () => {
      expect(service.isVisible()).toBe(false);
      
      service.toggleDialog();
      
      expect(service.isVisible()).toBe(true);
    });

    it('should toggle dialog visibility from true to false', () => {
      service['_isVisible'].set(true);
      
      service.toggleDialog();
      
      expect(service.isVisible()).toBe(false);
    });

    it('should toggle multiple times', () => {
      service.toggleDialog();
      expect(service.isVisible()).toBe(true);
      
      service.toggleDialog();
      expect(service.isVisible()).toBe(false);
      
      service.toggleDialog();
      expect(service.isVisible()).toBe(true);
    });
  });

  describe('isVisible signal', () => {
    it('should be readonly', () => {
      const isVisible = service.isVisible;
      expect(isVisible).toBeDefined();
      expect(typeof isVisible).toBe('function');
    });

    it('should reflect state changes', () => {
      service.setViewContainerRef(mockViewContainerRef);

      expect(service.isVisible()).toBe(false);
      
      service.openDialog();
      expect(service.isVisible()).toBe(true);
      
      service.closeDialog();
      expect(service.isVisible()).toBe(false);
      
      service.toggleDialog();
      expect(service.isVisible()).toBe(true);
    });
  });
});
