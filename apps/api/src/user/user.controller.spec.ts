import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    getStripeInstance: jest.fn(),
    stripeHandler: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleStripeWebhook', () => {
    it('should handle webhook successfully', async () => {
      const mockRequest = {
        rawBody: 'raw-body-content',
      } as any;

      const mockResponse = {} as any;
      const mockSignature = 'test-signature';

      const mockStripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue({
            type: 'customer.subscription.created',
            data: {
              object: {
                id: 'sub_123',
                customer: 'cus_123',
              },
            },
          }),
        },
      };

      mockUserService.getStripeInstance.mockReturnValue(mockStripe);
      mockUserService.stripeHandler.mockResolvedValue(undefined);

      process.env.STRIPE_ENDPOINT_SECRET = 'test-webhook-secret';

      await controller.handleStripeWebhook(
        mockRequest,
        mockResponse,
        mockSignature,
      );

      expect(mockUserService.getStripeInstance).toHaveBeenCalled();
      expect(mockUserService.stripeHandler).toHaveBeenCalled();
    });

    it('should handle webhook signature verification failure', async () => {
      const mockRequest = {
        rawBody: 'raw-body-content',
      } as any;

      const mockResponse = {} as any;
      const mockSignature = 'invalid-signature';

      const mockStripe = {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error('Webhook signature verification failed');
          }),
        },
      };

      mockUserService.getStripeInstance.mockReturnValue(mockStripe);

      process.env.STRIPE_ENDPOINT_SECRET = 'test-webhook-secret';

      // Should not throw, but log error
      await controller.handleStripeWebhook(
        mockRequest,
        mockResponse,
        mockSignature,
      );

      expect(mockUserService.getStripeInstance).toHaveBeenCalled();
      expect(mockUserService.stripeHandler).not.toHaveBeenCalled();
    });

    it('should use request body if rawBody is not available', async () => {
      const mockRequest = {
        body: 'body-content',
      } as any;

      const mockResponse = {} as any;
      const mockSignature = 'test-signature';

      const mockStripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue({
            type: 'customer.subscription.created',
            data: {
              object: {
                id: 'sub_123',
                customer: 'cus_123',
              },
            },
          }),
        },
      };

      mockUserService.getStripeInstance.mockReturnValue(mockStripe);
      mockUserService.stripeHandler.mockResolvedValue(undefined);

      process.env.STRIPE_ENDPOINT_SECRET = 'test-webhook-secret';

      await controller.handleStripeWebhook(
        mockRequest,
        mockResponse,
        mockSignature,
      );

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'body-content',
        mockSignature,
        'test-webhook-secret',
      );
    });
  });
});
